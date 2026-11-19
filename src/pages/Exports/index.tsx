import React, { useState } from 'react';
import { Box, Button, Center, Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Card, PageHeader } from '@/components/ui';
import { RegionFilter } from '@/components/Filters';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { ExportData } from '@/types/rdc';
import { alertError, toast } from '@/common/alert';
import { Sheet, downloadWorkbook } from '@/common/xlsx';
import { appreciationLabel, formatDate, fullName, functionLabel, sessionStatus } from '@/common/labels';
import { participantsOf, TLC_UNITS } from '../LearningCircles';
import { useUserContext } from '@/contexts/UserContext';
import i18n from '@/i18n';

const t = (key: string) => String(i18n.t(key));

const answerLabel = (type: string | undefined, value: number | null, notApplicable?: boolean) => {
  if (notApplicable) return t('rdc.answers.NA');
  if (value === null || value === undefined) return '';
  if (type === 'YES_NO') return t(value === 1 ? 'rdc.answers.YES' : 'rdc.answers.NO');
  return t(['', 'rdc.answers.LOW', 'rdc.answers.MEDIUM', 'rdc.answers.HIGH'][value] || '');
};

// One row per session, with the global score of each sub-domain
const sessionsSheet = (data: ExportData): Sheet => {
  const scored = data.competencies.filter((competence) => competence.has_global_score);
  return {
    name: t('exports.sheets.sessions'),
    rows: data.sessions.map((session) => {
      const scores = data.scores.filter((score) => score.session_id === session.id);
      const values = scores.map((score) => score.value).filter((value): value is number => !!value);
      const pdp = data.pdps.find((item) => item.session_id === session.id);
      return {
        [t('exports.columns.id')]: session.id,
        [t('sessions.date')]: formatDate(session.observation_started_at || session.created_at),
        [t('sessions.status')]: t(`rdc.status.${sessionStatus(session)}`),
        [t('sessions.teacher')]: fullName(session.teacher),
        [t('exports.columns.sex')]: session.teacher?.sex || '',
        [t('sessions.subject')]: session.subject || session.teacher?.subject || '',
        [t('sessions.school')]: session.school?.name || '',
        [t('sessions.region')]: session.school?.region?.name || '',
        [t('sessions.observer')]: fullName(session.coach),
        [t('sessions.function')]: functionLabel(session.observer_function || session.coach?.function),
        [t('exports.columns.school-year')]: session.school_year || '',
        ...Object.fromEntries(
          scored.map((competence) => [
            `${t('exports.columns.score')} ${competence.code}`,
            scores.find((score) => score.competence_id === competence.id)?.value ?? '',
          ]),
        ),
        [t('sessions.average')]: values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : '',
        [t('sessions.suggested-appreciation')]: session.suggested_appreciation ? appreciationLabel(session.suggested_appreciation) : '',
        [t('sessions.appreciation')]: session.appreciation ? appreciationLabel(session.appreciation) : '',
        [t('sessions.pdp')]: pdp?.status ? t(`rdc.pdp-status.${pdp.status}`) : '',
        [t('exports.columns.advice')]: session.advice || '',
      };
    }),
  };
};

// One row per session, one column per behaviour of the grid
const answersSheet = (data: ExportData): Sheet => {
  const questions = data.competencies.flatMap((competence) => competence.questions);
  return {
    name: t('exports.sheets.answers'),
    rows: data.sessions.map((session) => {
      const answers = data.answers.filter((answer) => answer.session_id === session.id);
      return {
        [t('exports.columns.id')]: session.id,
        [t('sessions.date')]: formatDate(session.observation_started_at || session.created_at),
        [t('sessions.teacher')]: fullName(session.teacher),
        [t('sessions.school')]: session.school?.name || '',
        ...Object.fromEntries(
          questions.map((question) => {
            const answer = answers.find((item) => item.question_id === question.id);
            return [question.code || question.id, answer ? answerLabel(question.type, answer.value, answer.not_applicable) : ''];
          }),
        ),
      };
    }),
  };
};

const checklistSheet = (data: ExportData): Sheet => ({
  name: t('exports.sheets.checklist'),
  rows: data.sessions.map((session) => ({
    [t('exports.columns.id')]: session.id,
    [t('sessions.date')]: formatDate(session.observation_started_at || session.created_at),
    [t('sessions.teacher')]: fullName(session.teacher),
    [t('sessions.school')]: session.school?.name || '',
    ...Object.fromEntries(
      data.checklist.map((item) => {
        const entry = data.documentations.find(
          (doc) => doc.session_id === session.id && doc.checklist_item_id === item.id,
        );
        return [
          `${item.code}. ${item.document_name}`,
          entry?.answer === true ? t('rdc.answers.YES') : entry?.answer === false ? t('rdc.answers.NO') : '',
        ];
      }),
    ),
  })),
});

const objectivesSheet = (data: ExportData): Sheet => {
  const questions = data.competencies.flatMap((competence) => competence.questions);
  return {
    name: t('exports.sheets.objectives'),
    rows: data.objectives.map((objective) => {
      const pdp = data.pdps.find((item) => item.id === objective.pdp_id);
      const session = data.sessions.find((item) => item.id === pdp?.session_id);
      const question = questions.find((item) => item.id === objective.question_id);
      return {
        [t('exports.columns.id')]: session?.id || '',
        [t('sessions.date')]: formatDate(session?.observation_started_at || session?.created_at),
        [t('sessions.teacher')]: fullName(session?.teacher),
        [t('sessions.school')]: session?.school?.name || '',
        [t('exports.columns.behaviour')]: question?.code || '',
        [t('exports.columns.category')]: objective.category ? t(`rdc.categories.${objective.category}`) : '',
        [t('pdp-rules.objective')]: objective.objective,
        [t('pdp-rules.actions')]: (objective.actions || '').split('\n').filter(Boolean).join(' ; '),
        [t('pdp-rules.indicator')]: objective.indicator || '',
        [t('exports.columns.due')]: formatDate(objective.due_date),
        [t('exports.columns.rules')]: pdp?.rule_set_version ?? '',
      };
    }),
  };
};

type ExportKind = 'results' | 'sessions' | 'circles';

// Excel files of the observations, limited to the region chosen
const ExportsPage: React.FC = () => {
  const { t: translate } = useTranslation();
  const { user } = useUserContext();
  const [regionId, setRegionId] = useState<string | undefined>(user?.region_id);
  const [running, setRunning] = useState<ExportKind>();

  const run = async (kind: ExportKind) => {
    setRunning(kind);
    try {
      if (kind === 'circles') {
        const circles = await RdcService.getLearningCircles(regionId);
        downloadWorkbook(t('exports.files.circles'), [
          {
            name: t('exports.sheets.circles'),
            rows: circles.map((circle) => ({
              [t('circles.date')]: formatDate(circle.created_at),
              [t('circles.unit')]: `${circle.unit_id}. ${TLC_UNITS[circle.unit_id]?.topic || ''}`,
              [t('sessions.school')]: circle.school_name,
              [t('sessions.observer')]: circle.coach_name || '',
              [t('circles.participants')]: circle.participants_count ?? participantsOf(circle).length,
              [t('exports.columns.names')]: participantsOf(circle).join(', '),
              [t('circles.rating')]: Number(circle.evaluation) || '',
            })),
          },
        ]);
      } else {
        const data = await RdcService.getExportData(regionId);
        if (data.sessions.length === 0) {
          toast.info(t('exports.nothing'));
          return;
        }
        downloadWorkbook(
          t(kind === 'results' ? 'exports.files.results' : 'exports.files.sessions'),
          kind === 'results'
            ? [sessionsSheet(data), answersSheet(data), checklistSheet(data), objectivesSheet(data)]
            : [sessionsSheet(data)],
        );
      }
      toast.success(t('exports.done'));
    } catch (error) {
      alertError(error);
    } finally {
      setRunning(undefined);
    }
  };

  const cards: { kind: ExportKind; icon: string; sheets: string[] }[] = [
    { kind: 'results', icon: 'analytics', sheets: ['sessions', 'answers', 'checklist', 'objectives'] },
    { kind: 'sessions', icon: 'clipboard-notes', sheets: ['sessions'] },
    { kind: 'circles', icon: 'users-alt', sheets: ['circles'] },
  ];

  return (
    <Box>
      <PageHeader
        eyebrow={translate('menu.observations')}
        title={translate('exports.title')}
        subtitle={translate('exports.subtitle')}
        actions={<RegionFilter onChange={setRegionId} />}
      />
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        {cards.map((card) => (
          <Card key={card.kind} p={6}>
            <Flex direction="column" h="full">
              <Center w="48px" h="48px" borderRadius="14px" bg="brand.50" mb={4}>
                <Icon name={card.icon} size={24} color="#3373CC" />
              </Center>
              <Text fontSize="17px" fontWeight={700} color="ink.900">
                {translate(`exports.cards.${card.kind}.title`)}
              </Text>
              <Text fontSize="14px" color="ink.600" mt={1.5} flex={1}>
                {translate(`exports.cards.${card.kind}.text`)}
              </Text>
              <HStack spacing={1.5} flexWrap="wrap" mt={4}>
                {card.sheets.map((sheet) => (
                  <Text key={sheet} fontSize="12px" px={2} py={0.5} borderRadius="6px" bg="ink.100" color="ink.700">
                    {translate(`exports.sheets.${sheet}`)}
                  </Text>
                ))}
              </HStack>
              <Button
                mt={5}
                leftIcon={<Icon name="download-alt" size={18} color="#FFFFFF" />}
                onClick={() => run(card.kind)}
                isLoading={running === card.kind}
                loadingText={translate('exports.preparing')}
                isDisabled={!!running && running !== card.kind}
              >
                {translate('exports.download')}
              </Button>
            </Flex>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ExportsPage;
