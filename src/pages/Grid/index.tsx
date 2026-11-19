import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Card, PageHeader, SkeletonCards, StatCard, StatusBadge } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { RdcCompetence, RdcQuestion } from '@/types/rdc';
import { alertError, toast } from '@/common/alert';
import { useUserContext } from '@/contexts/UserContext';

// Contextual help of a behaviour, saved as JSON: one guidance per answer (Oui, Faible, Moyen...)
type Help = { title?: string; subtitle?: string; items: { icon?: string; label: string; description: string }[] };

const parseHelp = (value?: string): Help | undefined => {
  try {
    const help = JSON.parse(value || '');
    return Array.isArray(help?.items) ? help : undefined;
  } catch {
    return undefined;
  }
};

// Observation grid of the paper tool (B04): domains, sub-domains and behaviours. The codes and
// the structure come with the grid; the wording and the help can be corrected here.
const GridPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [grid, setGrid] = useState<RdcCompetence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<{ competence: RdcCompetence; question: RdcQuestion }>();
  const isAdmin = user?.role === 'admin';

  const load = () =>
    RdcService.getGrid()
      .then(setGrid)
      .catch(alertError)
      .finally(() => setIsLoading(false));

  useEffect(() => {
    load();
  }, []);

  const domains = useMemo(() => {
    const result: { code: string; title: string; competencies: RdcCompetence[] }[] = [];
    grid.forEach((competence) => {
      const code = competence.domain_code || competence.code || '';
      const last = result[result.length - 1];
      if (last && last.code === code) last.competencies.push(competence);
      else result.push({ code, title: competence.domain_title || competence.title, competencies: [competence] });
    });
    return result;
  }, [grid]);

  const behaviours = grid.reduce((sum, competence) => sum + competence.questions.length, 0);
  const scored = grid.filter((competence) => competence.has_global_score).length;

  return (
    <Box>
      <PageHeader eyebrow={t('menu.reference')} title={t('grid.title')} subtitle={t('grid.subtitle')} />

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={5}>
            <StatCard icon="layers" label={t('grid.domains')} value={domains.length} />
            <StatCard icon="document-layout-right" tone="teal" label={t('grid.sub-domains')} value={grid.length} hint={t('grid.scored', { count: scored })} />
            <StatCard icon="check-square" tone="violet" label={t('grid.behaviours')} value={behaviours} />
          </SimpleGrid>

          <VStack align="stretch" spacing={6}>
            {domains.map((domain) => (
              <Box key={domain.code}>
                <Text fontSize="12px" fontWeight={800} color="ink.500" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                  {t('grid.domain', { code: domain.code })} · {domain.title}
                </Text>
                <VStack align="stretch" spacing={3}>
                  {domain.competencies.map((competence) => (
                    <Card key={competence.id} overflow="hidden">
                      <HStack px={5} py={3.5} bg="ink.50" borderBottom="1px solid" borderColor="ink.100" spacing={3}>
                        <Text fontWeight={800} color="brand.600" minW="40px">
                          {competence.code}
                        </Text>
                        <Text flex={1} fontWeight={700} color="ink.900">
                          {competence.title}
                        </Text>
                        {competence.has_global_score && <StatusBadge tone="brand">{t('grid.global-score')}</StatusBadge>}
                      </HStack>
                      {competence.questions.map((question, index) => (
                        <HStack key={question.id} px={5} py={3} spacing={3} align="flex-start" borderTop={index ? '1px solid' : 'none'} borderColor="ink.100">
                          <Text fontSize="13px" fontWeight={700} color="ink.500" minW="48px" pt="2px">
                            {question.code}
                          </Text>
                          <Box flex={1} minW={0}>
                            <Text fontSize="14px" color="ink.900">
                              {question.title}
                            </Text>
                            {parseHelp(question.tooltip_data) && (
                              <Text fontSize="12px" color="ink.500" mt={0.5}>
                                {t('grid.help-items', {
                                  value: parseHelp(question.tooltip_data)
                                    ?.items.map((item) => item.label)
                                    .join(', '),
                                })}
                              </Text>
                            )}
                          </Box>
                          <HStack spacing={1.5} flex="none">
                            <StatusBadge tone="gray">{t(question.type === 'YES_NO' ? 'grid.yes-no' : 'grid.fme')}</StatusBadge>
                            {question.allow_na && <StatusBadge tone="gray">{t('rdc.answers.NA')}</StatusBadge>}
                          </HStack>
                          {isAdmin && (
                            <IconButton
                              size="sm"
                              variant="ghost"
                              aria-label={t('grid.edit', { code: question.code })}
                              icon={<Icon name="edit" size={18} color="#576375" />}
                              onClick={() => setEditing({ competence, question })}
                            />
                          )}
                        </HStack>
                      ))}
                    </Card>
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        </>
      )}

      <QuestionDrawer
        editing={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          load();
        }}
      />
    </Box>
  );
};

const QuestionDrawer: React.FC<{
  editing?: { competence: RdcCompetence; question: RdcQuestion };
  onClose: () => void;
  onSaved: () => void;
}> = ({ editing, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [help, setHelp] = useState<Help>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(editing?.question.title || '');
    setHelp(parseHelp(editing?.question.tooltip_data));
  }, [editing]);

  const save = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await RdcService.updateCompetence({
        id: editing.competence.id,
        questions: [
          {
            id: editing.question.id,
            title: title.trim(),
            // The title of the help repeats the code and the wording of the behaviour
            ...(help
              ? {
                  tooltip_data: JSON.stringify({
                    ...help,
                    title: `${editing.question.code} ${title.trim()}`,
                    items: help.items.map((item) => ({ ...item, description: item.description.trim() })),
                  }),
                }
              : {}),
          } as RdcQuestion,
        ],
      });
      toast.success(t('grid.saved'));
      onSaved();
    } catch (error) {
      alertError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={!!editing} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton mt={2} />
        <DrawerHeader pr={12}>
          <Text fontSize="13px" color="brand.600" fontWeight={700}>
            {editing?.competence.code} · {editing?.competence.title}
          </Text>
          <Text fontSize="16px" fontWeight={700}>
            {t('grid.behaviour', { code: editing?.question.code })}
          </Text>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('grid.wording')}
              </FormLabel>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </FormControl>
            {help && (
              <Box>
                <Text fontSize="14px" fontWeight={700} color="ink.900">
                  {t('grid.help')}
                </Text>
                <Text fontSize="12px" color="ink.500" mb={3}>
                  {t('grid.help-text')}
                </Text>
                <VStack spacing={4} align="stretch">
                  {help.items.map((item, index) => (
                    <FormControl key={item.label}>
                      <FormLabel fontSize="13px" fontWeight={600}>
                        {item.label}
                      </FormLabel>
                      <Textarea
                        rows={3}
                        value={item.description}
                        onChange={(event) =>
                          setHelp({
                            ...help,
                            items: help.items.map((entry, position) =>
                              position === index ? { ...entry, description: event.target.value } : entry,
                            ),
                          })
                        }
                      />
                    </FormControl>
                  ))}
                </VStack>
              </Box>
            )}
            <Text fontSize="13px" color="ink.500">
              {t('grid.sync-note')}
            </Text>
          </VStack>
        </DrawerBody>
        <DrawerFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} isLoading={isSaving} isDisabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default GridPage;
