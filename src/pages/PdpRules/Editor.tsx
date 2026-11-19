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
  FormHelperText,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, EmptyState, PageHeader, PageLoader, StatusBadge } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { DiagnosticConfig, PdpLibraryItem, PdpRuleSet, RdcCompetence, RdcQuestion } from '@/types/rdc';
import { alertError, confirm, toast } from '@/common/alert';
import { formatDate } from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';
import { RULE_STATUS_TONES } from '.';

const ANSWER_CODES = ['YES', 'NO', 'HIGH', 'MEDIUM', 'LOW'] as const;
const CATEGORIES = ['strength', 'consolidate', 'priority'] as const;
type Category = (typeof CATEGORIES)[number];

const categoryOf = (config: DiagnosticConfig, code: string): Category =>
  CATEGORIES.find((category) => config[category].includes(code)) || 'consolidate';

const NumberField: React.FC<{
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  isReadOnly: boolean;
  onChange: (value: number) => void;
}> = ({ label, help, value, min, max, isReadOnly, onChange }) => (
  <FormControl>
    <FormLabel fontSize="14px" fontWeight={600}>
      {label}
    </FormLabel>
    <NumberInput
      value={value}
      min={min}
      max={max}
      isReadOnly={isReadOnly}
      onChange={(_, number) => !Number.isNaN(number) && onChange(Math.min(max, Math.max(min, number)))}
      bg="white"
    >
      <NumberInputField borderRadius="10px" />
      {!isReadOnly && (
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      )}
    </NumberInput>
    <FormHelperText fontSize="12px">{help}</FormHelperText>
  </FormControl>
);

// One version of the PDP rules: read only once published, editable while it is a draft
const PdpRuleEditor: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [ruleSet, setRuleSet] = useState<PdpRuleSet>();
  const [config, setConfig] = useState<DiagnosticConfig>();
  const [maxObjectives, setMaxObjectives] = useState(3);
  const [library, setLibrary] = useState<{ [questionId: string]: PdpLibraryItem }>({});
  const [grid, setGrid] = useState<RdcCompetence[]>([]);
  const [editing, setEditing] = useState<RdcQuestion>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isDraft = ruleSet?.status === 'DRAFT' && user?.role === 'admin';

  const load = async () => {
    if (!id) return;
    try {
      const [data, competencies] = await Promise.all([RdcService.getRuleSet(id), RdcService.getGrid()]);
      setRuleSet(data);
      setConfig(data.diagnostic_config);
      setMaxObjectives(data.max_objectives || 3);
      setLibrary(Object.fromEntries(data.library.map((item) => [item.question_id, item])));
      setGrid(competencies);
      setIsDirty(false);
    } catch (error) {
      alertError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Changes not saved are not lost by closing the tab
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const questions = useMemo(() => grid.flatMap((competence) => competence.questions), [grid]);
  const missing = questions.filter((question) => !library[question.id]?.objective?.trim()).length;

  const setCategory = (code: string, category: Category) => {
    if (!config) return;
    const next = { ...config };
    CATEGORIES.forEach((item) => {
      next[item] = next[item].filter((value) => value !== code);
    });
    next[category] = [...next[category], code];
    setConfig(next);
    setIsDirty(true);
  };

  const save = async (silent = false) => {
    if (!ruleSet || !config) return false;
    setIsSaving(true);
    try {
      await RdcService.updateDraft(ruleSet.id, {
        diagnostic_config: config,
        max_objectives: maxObjectives,
        library: Object.values(library).filter((item) => item.objective?.trim()),
      });
      setIsDirty(false);
      if (!silent) toast.success(t('pdp-rules.saved'));
      return true;
    } catch (error) {
      alertError(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    if (!ruleSet) return;
    const confirmed = await confirm({
      title: t('pdp-rules.publish-title', { version: ruleSet.version }),
      text: missing
        ? t('pdp-rules.publish-text-missing', { count: missing })
        : t('pdp-rules.publish-text'),
      confirmText: t('pdp-rules.publish'),
      icon: missing ? 'warning' : 'question',
      onConfirm: async () => {
        if (isDirty && !(await save(true))) throw new Error(t('pdp-rules.save-first'));
        await RdcService.publishDraft(ruleSet.id);
      },
    });
    if (confirmed) {
      toast.success(t('pdp-rules.published-toast', { version: ruleSet.version }));
      load();
    }
  };

  const remove = async () => {
    if (!ruleSet) return;
    const confirmed = await confirm({
      title: t('pdp-rules.delete-title', { version: ruleSet.version }),
      text: t('pdp-rules.delete-text'),
      confirmText: t('common.delete'),
      danger: true,
      onConfirm: () => RdcService.deleteDraft(ruleSet.id),
    });
    if (confirmed) {
      toast.success(t('pdp-rules.deleted'));
      navigate('/admin/pdp-rules');
    }
  };

  const leave = async () => {
    if (!isDirty || (await confirm({ title: t('pdp-rules.leave-title'), text: t('pdp-rules.leave-text'), danger: true, confirmText: t('pdp-rules.leave') })))
      navigate('/admin/pdp-rules');
  };

  if (isLoading) return <PageLoader />;
  if (!ruleSet || !config) {
    return (
      <Card>
        <EmptyState icon="sliders-v" title={t('pdp-rules.not-found')} />
      </Card>
    );
  }

  return (
    <Box pb={isDraft ? 24 : 0}>
      <Button variant="ghost" size="sm" ml={-2} mb={3} color="brand.600" leftIcon={<Icon name="arrow-left" size={16} color="#3373CC" />} onClick={leave}>
        {t('pdp-rules.back')}
      </Button>
      <PageHeader
        eyebrow={t('pdp-rules.title')}
        title={t('pdp-rules.version', { version: ruleSet.version })}
        subtitle={
          ruleSet.status === 'DRAFT'
            ? t('pdp-rules.draft-subtitle')
            : t('pdp-rules.published', {
                date: formatDate(ruleSet.published_at),
                name: ruleSet.published_by_name || t('pdp-rules.initial'),
              })
        }
        actions={<StatusBadge tone={RULE_STATUS_TONES[ruleSet.status]}>{t(`pdp-rules.status.${ruleSet.status}`)}</StatusBadge>}
      />

      <SimpleGrid columns={{ base: 1, xl: 5 }} spacing={4}>
        <Card gridColumn={{ xl: 'span 3' }}>
          <CardHeader title={t('pdp-rules.diagnostic')} subtitle={t('pdp-rules.diagnostic-subtitle')} />
          <Box px={5} pb={5}>
            {ANSWER_CODES.map((code, index) => (
              <HStack key={code} py={2.5} spacing={4} borderTop={index ? '1px solid' : 'none'} borderColor="ink.100">
                <Box flex={1}>
                  <Text fontWeight={600} color="ink.900">
                    {t(`rdc.answers.${code}`)}
                  </Text>
                  <Text fontSize="12px" color="ink.500">
                    {t(code === 'YES' || code === 'NO' ? 'pdp-rules.yes-no' : 'pdp-rules.fme')}
                  </Text>
                </Box>
                <Select
                  w="220px"
                  value={categoryOf(config, code)}
                  isDisabled={!isDraft}
                  onChange={(event) => setCategory(code, event.target.value as Category)}
                  aria-label={t(`rdc.answers.${code}`)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(`pdp-rules.categories.${category}`)}
                    </option>
                  ))}
                </Select>
              </HStack>
            ))}
          </Box>
        </Card>

        <Card gridColumn={{ xl: 'span 2' }}>
          <CardHeader title={t('pdp-rules.settings')} />
          <VStack px={5} pb={5} spacing={5} align="stretch">
            <NumberField
              label={t('pdp-rules.threshold')}
              help={t('pdp-rules.threshold-help')}
              value={config.priority_threshold}
              min={1}
              max={5}
              isReadOnly={!isDraft}
              onChange={(value) => {
                setConfig({ ...config, priority_threshold: value });
                setIsDirty(true);
              }}
            />
            <NumberField
              label={t('pdp-rules.max-objectives')}
              help={t('pdp-rules.max-objectives-help')}
              value={maxObjectives}
              min={1}
              max={10}
              isReadOnly={!isDraft}
              onChange={(value) => {
                setMaxObjectives(value);
                setIsDirty(true);
              }}
            />
            <NumberField
              label={t('pdp-rules.due')}
              help={t('pdp-rules.due-help')}
              value={config.due_in_days}
              min={1}
              max={365}
              isReadOnly={!isDraft}
              onChange={(value) => {
                setConfig({ ...config, due_in_days: value });
                setIsDirty(true);
              }}
            />
          </VStack>
        </Card>
      </SimpleGrid>

      <Card mt={4}>
        <CardHeader
          title={t('pdp-rules.library')}
          subtitle={t('pdp-rules.library-subtitle')}
          action={
            missing > 0 ? (
              <StatusBadge tone="yellow">{t('pdp-rules.missing', { count: missing })}</StatusBadge>
            ) : (
              <StatusBadge tone="green">{t('pdp-rules.complete')}</StatusBadge>
            )
          }
        />
        {grid.map((competence) => (
          <Box key={competence.id}>
            <HStack px={5} py={2.5} bg="ink.50" borderTop="1px solid" borderBottom="1px solid" borderColor="ink.100">
              <Text fontWeight={800} color="brand.600" minW="40px" fontSize="14px">
                {competence.code}
              </Text>
              <Text fontWeight={700} color="ink.800" fontSize="14px">
                {competence.title}
              </Text>
            </HStack>
            {competence.questions.map((question) => {
              const item = library[question.id];
              const actions = (item?.actions || '').split('\n').filter((action) => action.trim()).length;
              return (
                <HStack
                  key={question.id}
                  as="button"
                  w="full"
                  textAlign="left"
                  px={5}
                  py={3}
                  spacing={4}
                  borderBottom="1px solid"
                  borderColor="ink.100"
                  _hover={{ bg: 'brand.50' }}
                  onClick={() => setEditing(question)}
                  align="flex-start"
                >
                  <Text fontSize="13px" fontWeight={700} color="ink.500" minW="48px" pt="1px">
                    {question.code}
                  </Text>
                  <Box flex={1} minW={0}>
                    <Text fontSize="13px" color="ink.500" noOfLines={1}>
                      {question.title}
                    </Text>
                    {item?.objective ? (
                      <Text fontSize="14px" fontWeight={600} color="ink.900" noOfLines={2}>
                        {item.objective}
                      </Text>
                    ) : (
                      <Text fontSize="14px" color="#9B6908">
                        {t('pdp-rules.no-objective')}
                      </Text>
                    )}
                  </Box>
                  <Text fontSize="12px" color="ink.500" whiteSpace="nowrap" pt="2px">
                    {t('pdp-rules.actions-count', { count: actions })}
                  </Text>
                  <Icon name={isDraft ? 'edit' : 'eye'} size={18} color="#9AA2AC" />
                </HStack>
              );
            })}
          </Box>
        ))}
      </Card>

      <LibraryDrawer
        question={editing}
        item={editing ? library[editing.id] : undefined}
        isReadOnly={!isDraft}
        onClose={() => setEditing(undefined)}
        onSave={(item) => {
          setLibrary({ ...library, [item.question_id]: item });
          setIsDirty(true);
          setEditing(undefined);
        }}
      />

      {isDraft && (
        <HStack
          position="fixed"
          bottom={0}
          left={{ base: 0, lg: '264px' }}
          right={0}
          zIndex={20}
          px={{ base: 4, md: 8 }}
          py={3}
          bg="white"
          borderTop="1px solid"
          borderColor="ink.200"
          boxShadow="0 -8px 24px -12px rgba(16, 24, 40, 0.18)"
          spacing={3}
          flexWrap="wrap"
        >
          <Text flex={1} fontSize="14px" color={isDirty ? '#9B6908' : 'ink.500'} minW="200px">
            {isDirty ? t('pdp-rules.unsaved') : t('pdp-rules.all-saved')}
          </Text>
          <Button variant="ghost" colorScheme="red" onClick={remove}>
            {t('pdp-rules.delete')}
          </Button>
          <Button variant="outline" onClick={() => save()} isLoading={isSaving} isDisabled={!isDirty}>
            {t('pdp-rules.save')}
          </Button>
          <Button leftIcon={<Icon name="upload" size={18} color="#FFFFFF" />} onClick={publish}>
            {t('pdp-rules.publish')}
          </Button>
        </HStack>
      )}
    </Box>
  );
};

const LibraryDrawer: React.FC<{
  question?: RdcQuestion;
  item?: PdpLibraryItem;
  isReadOnly: boolean;
  onClose: () => void;
  onSave: (item: PdpLibraryItem) => void;
}> = ({ question, item, isReadOnly, onClose, onSave }) => {
  const { t } = useTranslation();
  const [objective, setObjective] = useState('');
  const [actions, setActions] = useState('');
  const [indicator, setIndicator] = useState('');

  useEffect(() => {
    setObjective(item?.objective || '');
    setActions(item?.actions || '');
    setIndicator(item?.indicator || '');
  }, [question, item]);

  return (
    <Drawer isOpen={!!question} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton mt={2} />
        <DrawerHeader pr={12}>
          <Text fontSize="13px" color="brand.600" fontWeight={700}>
            {t('pdp-rules.behaviour', { code: question?.code })}
          </Text>
          <Text fontSize="16px" fontWeight={700} color="ink.900">
            {question?.title}
          </Text>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired={!isReadOnly}>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('pdp-rules.objective')}
              </FormLabel>
              <Textarea rows={3} value={objective} onChange={(event) => setObjective(event.target.value)} isReadOnly={isReadOnly} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('pdp-rules.actions')}
              </FormLabel>
              <Textarea rows={6} value={actions} onChange={(event) => setActions(event.target.value)} isReadOnly={isReadOnly} />
              <FormHelperText fontSize="12px">{t('pdp-rules.actions-help')}</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('pdp-rules.indicator')}
              </FormLabel>
              <Textarea rows={2} value={indicator} onChange={(event) => setIndicator(event.target.value)} isReadOnly={isReadOnly} />
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            {isReadOnly ? t('common.close') : t('common.cancel')}
          </Button>
          {!isReadOnly && question && (
            <Button
              isDisabled={!objective.trim()}
              onClick={() =>
                onSave({
                  ...item,
                  question_id: question.id,
                  objective: objective.trim(),
                  actions: actions
                    .split('\n')
                    .map((action) => action.trim())
                    .filter(Boolean)
                    .join('\n'),
                  indicator: indicator.trim(),
                })
              }
            >
              {t('pdp-rules.apply')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PdpRuleEditor;
