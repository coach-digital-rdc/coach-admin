import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Center,
  HStack,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, EmptyState, InfoItem, PageLoader, ScorePill, StatusBadge } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { RdcQuestion, SessionDetails } from '@/types/rdc';
import { alertError } from '@/common/alert';
import { printReport } from '@/common/report';
import { appreciationLabel, formatDate, formatNumber, fullName, functionLabel } from '@/common/labels';
import { SessionStatusBadge } from '.';

const ANSWER_LABELS: { [type: string]: string[] } = {
  YES_NO: ['rdc.answers.NO', 'rdc.answers.YES'],
  FME: ['', 'rdc.answers.LOW', 'rdc.answers.MEDIUM', 'rdc.answers.HIGH'],
};

const answerTone = (question: RdcQuestion, value: number | null) => {
  if (value === null) return 'gray';
  if (question.type === 'YES_NO') return value === 1 ? 'green' : 'red';
  return value === 3 ? 'green' : value === 2 ? 'yellow' : 'red';
};

const SessionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<SessionDetails>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    RdcService.getSessionDetails(id)
      .then(setDetails)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, [id]);

  const answers = useMemo(
    () => Object.fromEntries((details?.answers || []).map((answer) => [answer.question_id, answer])),
    [details],
  );
  const scores = useMemo(
    () => Object.fromEntries((details?.scores || []).map((score) => [score.competence_id, score])),
    [details],
  );
  const average = useMemo(() => {
    const values = (details?.scores || []).map((score) => score.value).filter((value): value is number => !!value);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }, [details]);

  const print = (kind: 'observation' | 'pdp') => {
    try {
      if (details) printReport(details, kind);
    } catch (error) {
      alertError(error);
    }
  };

  if (isLoading) return <PageLoader label={t('session-detail.loading')} />;
  if (!details) {
    return (
      <Card>
        <EmptyState
          icon="clipboard-notes"
          title={t('session-detail.not-found')}
          action={<Button onClick={() => navigate('/admin/sessions')}>{t('session-detail.back')}</Button>}
        />
      </Card>
    );
  }

  const { session } = details;
  const questionCode = (questionId?: string | null) =>
    details.competencies.flatMap((competence) => competence.questions).find((question) => question.id === questionId);
  const activity = [...(session.activities || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];

  return (
    <Box>
      <Button
        variant="ghost"
        size="sm"
        ml={-2}
        mb={3}
        leftIcon={<Icon name="arrow-left" size={16} color="#3373CC" />}
        color="brand.600"
        onClick={() => navigate('/admin/sessions')}
      >
        {t('session-detail.back')}
      </Button>

      <Card p={{ base: 5, md: 6 }} mb={5}>
        <HStack align="flex-start" spacing={4} flexWrap="wrap">
          <Box flex={1} minW="260px">
            <HStack spacing={2} mb={2}>
              <SessionStatusBadge session={session} />
              {details.pdp && (
                <StatusBadge tone={details.pdp.status === 'VALIDATED' ? 'green' : 'yellow'}>
                  {t(`rdc.pdp-status.${details.pdp.status}`, { defaultValue: details.pdp.status })}
                </StatusBadge>
              )}
            </HStack>
            <Text as="h1" fontSize={{ base: '22px', md: '26px' }} fontWeight={700} color="ink.900">
              {fullName(session.teacher)}
            </Text>
            <Text color="ink.600" mt={1}>
              {[session.school?.name, session.school?.region?.name].filter(Boolean).join(' · ')}
            </Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            <Button leftIcon={<Icon name="print" size={18} color="#FFFFFF" />} onClick={() => print('observation')}>
              {t('session-detail.print-observation')}
            </Button>
            <Button
              variant="outline"
              leftIcon={<Icon name="print" size={18} color="#3373CC" />}
              onClick={() => print('pdp')}
              isDisabled={!details.pdp}
            >
              {t('session-detail.print-pdp')}
            </Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={5} mt={6} pt={5} borderTop="1px solid" borderColor="ink.100">
          <InfoItem label={t('session-detail.date')} value={formatDate(session.observation_started_at || session.created_at, true)} />
          <InfoItem label={t('sessions.observer')} value={fullName(session.coach)} />
          <InfoItem label={t('sessions.function')} value={functionLabel(session.observer_function || session.coach?.function)} />
          <InfoItem label={t('session-detail.class')} value={[activity?.class_name, activity?.discipline || session.subject].filter(Boolean).join(' · ')} />
          <InfoItem label={t('sessions.average')} value={<ScorePill value={average} />} />
          <InfoItem
            label={t('sessions.appreciation')}
            value={
              session.appreciation ? (
                <Box as="span">
                  {appreciationLabel(session.appreciation)}
                  {session.suggested_appreciation && session.suggested_appreciation !== session.appreciation && (
                    <Text as="span" display="block" fontSize="12px" color="ink.500" fontWeight={400}>
                      {t('session-detail.suggested', { value: appreciationLabel(session.suggested_appreciation) })}
                    </Text>
                  )}
                </Box>
              ) : undefined
            }
          />
        </SimpleGrid>
      </Card>

      <Tabs variant="soft-rounded" isLazy>
        <TabList overflowX="auto" pb={2} gap={1}>
          {['grid', 'checklist', 'notes', 'pdp', 'signatures', 'header'].map((tab) => (
            <Tab key={tab} fontSize="14px" whiteSpace="nowrap" _selected={{ bg: 'brand.500', color: 'white' }} color="ink.700">
              {t(`session-detail.tabs.${tab}`)}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              {details.competencies.map((competence) => (
                <Card key={competence.id} overflow="hidden">
                  <HStack px={5} py={4} bg="ink.50" borderBottom="1px solid" borderColor="ink.100" spacing={3}>
                    <Text fontWeight={800} color="brand.600" minW="40px">
                      {competence.code}
                    </Text>
                    <Box flex={1}>
                      <Text fontWeight={700} color="ink.900">
                        {competence.title}
                      </Text>
                      {competence.domain_title && competence.domain_title !== competence.title && (
                        <Text fontSize="12px" color="ink.500">
                          {competence.domain_title}
                        </Text>
                      )}
                    </Box>
                    {competence.has_global_score && (
                      <VStack spacing={0} align="flex-end">
                        <ScorePill value={scores[competence.id]?.value} />
                        {scores[competence.id]?.suggested_value &&
                          scores[competence.id]?.suggested_value !== scores[competence.id]?.value && (
                            <Text fontSize="11px" color="ink.500">
                              {t('session-detail.suggested', { value: scores[competence.id]?.suggested_value })}
                            </Text>
                          )}
                      </VStack>
                    )}
                  </HStack>
                  {competence.questions.map((question, index) => {
                    const answer = answers[question.id];
                    const value = answer && !answer.not_applicable ? answer.value : null;
                    return (
                      <HStack key={question.id} px={5} py={3} spacing={3} borderTop={index ? '1px solid' : 'none'} borderColor="ink.100" align="flex-start">
                        <Text fontSize="13px" fontWeight={700} color="ink.500" minW="48px">
                          {question.code}
                        </Text>
                        <Text flex={1} fontSize="14px" color="ink.800">
                          {question.title}
                        </Text>
                        {!answer ? (
                          <Text fontSize="13px" color="ink.400">
                            {t('session-detail.not-answered')}
                          </Text>
                        ) : answer.not_applicable ? (
                          <StatusBadge tone="gray">{t('rdc.answers.NA')}</StatusBadge>
                        ) : (
                          <StatusBadge tone={answerTone(question, value)}>
                            {t(ANSWER_LABELS[question.type || 'FME']?.[value ?? 0] || '—')}
                          </StatusBadge>
                        )}
                      </HStack>
                    );
                  })}
                </Card>
              ))}
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <Card>
              {details.checklist.map((item, index) => {
                const entry = details.documentations.find((doc) => doc.checklist_item_id === item.id);
                return (
                  <HStack key={item.id} px={5} py={3.5} spacing={4} borderTop={index ? '1px solid' : 'none'} borderColor="ink.100" align="flex-start">
                    <Center w="28px" h="28px" borderRadius="8px" bg="ink.100" fontSize="13px" fontWeight={700} color="ink.700" flex="none">
                      {item.code}
                    </Center>
                    <Box flex={1}>
                      <Text fontWeight={600} color="ink.900">
                        {item.document_name}
                      </Text>
                      <Text fontSize="13px" color="ink.500">
                        {item.statement}
                      </Text>
                      {entry?.proposal && (
                        <Text mt={1.5} fontSize="13px" color="ink.800" bg="yellow.50" px={3} py={2} borderRadius="8px">
                          {t('session-detail.proposal')} : {entry.proposal}
                        </Text>
                      )}
                    </Box>
                    {entry?.answer === true ? (
                      <StatusBadge tone="green">{t('rdc.answers.YES')}</StatusBadge>
                    ) : entry?.answer === false ? (
                      <StatusBadge tone="red">{t('rdc.answers.NO')}</StatusBadge>
                    ) : (
                      <Text fontSize="13px" color="ink.400">
                        {t('session-detail.not-answered')}
                      </Text>
                    )}
                  </HStack>
                );
              })}
            </Card>
          </TabPanel>

          <TabPanel px={0}>
            <Card>
              {details.notes.length === 0 ? (
                <EmptyState icon="notes" title={t('session-detail.no-notes')} />
              ) : (
                details.notes.map((note, index) => (
                  <HStack key={note.id} px={5} py={3.5} spacing={4} borderTop={index ? '1px solid' : 'none'} borderColor="ink.100" align="flex-start">
                    <Text fontSize="13px" fontWeight={700} color="brand.600" minW="56px">
                      {new Date(note.noted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text flex={1} fontSize="14px" color="ink.800" whiteSpace="pre-wrap">
                      {note.content}
                    </Text>
                  </HStack>
                ))
              )}
            </Card>
          </TabPanel>

          <TabPanel px={0}>
            {!details.pdp ? (
              <Card>
                <EmptyState icon="file-blank" title={t('session-detail.no-pdp')} />
              </Card>
            ) : (
              <Card>
                <CardHeader
                  title={t('session-detail.pdp-title')}
                  subtitle={t('session-detail.pdp-subtitle', {
                    version: details.pdp.rule_set_version ?? details.pdp.rule_set?.version ?? '—',
                    date: formatDate(details.pdp.validated_at),
                  })}
                />
                {details.pdp.objectives.map((objective, index) => {
                  const question = questionCode(objective.question_id);
                  return (
                    <Box key={objective.id} px={5} py={4} borderTop="1px solid" borderColor="ink.100">
                      <HStack spacing={2} mb={2} flexWrap="wrap">
                        <StatusBadge tone="brand">{t('session-detail.objective-n', { value: index + 1 })}</StatusBadge>
                        {question && <StatusBadge tone="gray">{question.code}</StatusBadge>}
                        {objective.category && (
                          <StatusBadge tone={objective.category === 'PRIORITY' ? 'red' : 'yellow'}>
                            {t(`rdc.categories.${objective.category}`, { defaultValue: objective.category })}
                          </StatusBadge>
                        )}
                        <Text fontSize="13px" color="ink.500">
                          {t('session-detail.due', { date: formatDate(objective.due_date) })}
                        </Text>
                      </HStack>
                      <Text fontWeight={700} color="ink.900">
                        {objective.objective}
                      </Text>
                      {question && (
                        <Text fontSize="13px" color="ink.500" mt={0.5}>
                          {question.title}
                        </Text>
                      )}
                      <VStack align="stretch" spacing={1} mt={2}>
                        {(objective.actions || '')
                          .split('\n')
                          .filter((action) => action.trim())
                          .map((action) => (
                            <HStack key={action} align="flex-start" spacing={2}>
                              <Icon name="check" size={16} color="#31C436" mt="2px" />
                              <Text fontSize="14px" color="ink.800">
                                {action}
                              </Text>
                            </HStack>
                          ))}
                      </VStack>
                      {objective.indicator && (
                        <Text fontSize="13px" color="ink.600" mt={2}>
                          <Text as="span" fontWeight={600}>
                            {t('session-detail.indicator')} :
                          </Text>{' '}
                          {objective.indicator}
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </Card>
            )}
          </TabPanel>

          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {(['TEACHER', 'SCHOOL_HEAD', 'OBSERVER'] as const).map((role) => {
                const signature = details.signatures.find((item) => item.signer_role === role);
                const svg = role === 'SCHOOL_HEAD' && session.observer_function === 'SCHOOL_HEAD'
                  ? details.signatures.find((item) => item.signer_role === 'OBSERVER')?.svg
                  : signature?.svg;
                return (
                  <Card key={role} p={5}>
                    <Text fontSize="12px" fontWeight={700} color="ink.500" textTransform="uppercase" letterSpacing="0.04em">
                      {t(`session-detail.signers.${role}`)}
                    </Text>
                    <Center
                      h="120px"
                      my={3}
                      borderRadius="12px"
                      bg="ink.50"
                      border="1px dashed"
                      borderColor="ink.200"
                      sx={{ svg: { maxH: '110px', maxW: '100%' } }}
                    >
                      {svg ? (
                        <Box dangerouslySetInnerHTML={{ __html: svg }} />
                      ) : (
                        <Text fontSize="13px" color="ink.500" px={4} textAlign="center">
                          {signature?.refusal_reason
                            ? t('session-detail.refused', { reason: signature.refusal_reason })
                            : signature?.absence_reason
                            ? t('session-detail.absent', { reason: signature.absence_reason })
                            : t('session-detail.not-signed')}
                        </Text>
                      )}
                    </Center>
                    <Text fontWeight={600} color="ink.900">
                      {signature?.signer_name || '—'}
                    </Text>
                    <Text fontSize="13px" color="ink.500">
                      {signature?.signed_at ? formatDate(signature.signed_at, true) : ''}
                    </Text>
                  </Card>
                );
              })}
            </SimpleGrid>
          </TabPanel>

          <TabPanel px={0}>
            <Card p={6}>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                <InfoItem label={t('session-detail.school-year')} value={session.school_year} />
                <InfoItem label={t('session-detail.weekly-load')} value={session.teacher_weekly_load ? `${session.teacher_weekly_load} h` : undefined} />
                <InfoItem
                  label={t('session-detail.last-observation')}
                  value={
                    session.last_observation_date
                      ? `${formatDate(session.last_observation_date)} · ${appreciationLabel(session.last_observation_rating)}`
                      : undefined
                  }
                />
                <InfoItem label={t('session-detail.sub-domain')} value={activity?.sub_domain} />
                <InfoItem label={t('session-detail.sheet')} value={activity?.sheet_code} />
                <InfoItem label={t('session-detail.time')} value={[session.start_time, session.end_time].filter(Boolean).join(' – ')} />
                <InfoItem label={t('session-detail.knowledge')} value={activity?.essential_knowledge} />
                <InfoItem label={t('session-detail.place')} value={session.signed_place} />
                <InfoItem
                  label={t('session-detail.duration')}
                  value={
                    session.observation_started_at && session.observation_ended_at
                      ? t('session-detail.minutes', {
                          value: formatNumber(
                            (new Date(session.observation_ended_at).getTime() -
                              new Date(session.observation_started_at).getTime()) /
                              60000,
                            0,
                          ),
                        })
                      : undefined
                  }
                />
              </SimpleGrid>
              <Box mt={6}>
                <InfoItem label={t('session-detail.advice')} value={session.advice} />
              </Box>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SessionDetailPage;
