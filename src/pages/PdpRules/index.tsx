import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, PageHeader, SkeletonCards, StatusBadge } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { PdpRuleSet } from '@/types/rdc';
import { alertError, toast } from '@/common/alert';
import { formatDate } from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';

export const RULE_STATUS_TONES = { DRAFT: 'yellow', PUBLISHED: 'green', ARCHIVED: 'gray' } as const;

// Versions of the PDP rules (B19): the published one is applied by the devices offline
const PdpRulesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [ruleSets, setRuleSets] = useState<PdpRuleSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    RdcService.getRuleSets()
      .then(setRuleSets)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, []);

  const draft = ruleSets.find((ruleSet) => ruleSet.status === 'DRAFT');
  const published = ruleSets.find((ruleSet) => ruleSet.status === 'PUBLISHED');

  const createDraft = async () => {
    setIsCreating(true);
    try {
      const created = await RdcService.createDraft(published?.id);
      toast.success(t('pdp-rules.draft-created', { version: created.version }));
      navigate(`/admin/pdp-rules/${created.id}`);
    } catch (error) {
      alertError(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.reference')}
        title={t('pdp-rules.title')}
        subtitle={t('pdp-rules.subtitle')}
        actions={
          isAdmin &&
          (draft ? (
            <Button leftIcon={<Icon name="edit" size={18} color="#FFFFFF" />} onClick={() => navigate(`/admin/pdp-rules/${draft.id}`)}>
              {t('pdp-rules.resume-draft', { version: draft.version })}
            </Button>
          ) : (
            <Button leftIcon={<Icon name="plus" size={18} color="#FFFFFF" />} onClick={createDraft} isLoading={isCreating}>
              {t('pdp-rules.new-draft')}
            </Button>
          ))
        }
      />

      <Card p={5} mb={5} bg="brand.50" borderColor="brand.100" boxShadow="none">
        <HStack align="flex-start" spacing={3}>
          <Icon name="info-circle" size={20} color="#0052A3" />
          <Text fontSize="14px" color="brand.800">
            {t('pdp-rules.how-it-works')}
          </Text>
        </HStack>
      </Card>

      {isLoading ? (
        <SkeletonCards count={3} height="160px" />
      ) : ruleSets.length === 0 ? (
        <Card>
          <EmptyState icon="sliders-v" title={t('pdp-rules.empty')} />
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {ruleSets.map((ruleSet) => (
            <Card
              key={ruleSet.id}
              as="button"
              textAlign="left"
              p={5}
              onClick={() => navigate(`/admin/pdp-rules/${ruleSet.id}`)}
              transition="box-shadow 150ms, border-color 150ms"
              _hover={{ boxShadow: 'raised', borderColor: 'brand.200' }}
              borderColor={ruleSet.status === 'PUBLISHED' ? 'green.200' : 'ink.200'}
            >
              <HStack justify="space-between" mb={3}>
                <Text fontSize="20px" fontWeight={800} color="ink.900">
                  {t('pdp-rules.version', { version: ruleSet.version })}
                </Text>
                <StatusBadge tone={RULE_STATUS_TONES[ruleSet.status]}>{t(`pdp-rules.status.${ruleSet.status}`)}</StatusBadge>
              </HStack>
              <Text fontSize="13px" color="ink.600">
                {ruleSet.status === 'DRAFT'
                  ? t('pdp-rules.updated', { date: formatDate(ruleSet.updated_at, true) })
                  : t('pdp-rules.published', {
                      date: formatDate(ruleSet.published_at),
                      name: ruleSet.published_by_name || t('pdp-rules.initial'),
                    })}
              </Text>
              <SimpleGrid columns={3} spacing={2} mt={4} pt={4} borderTop="1px solid" borderColor="ink.100">
                {[
                  [t('pdp-rules.max-objectives-short'), ruleSet.max_objectives],
                  [t('pdp-rules.library-short'), ruleSet.library_count],
                  [t('pdp-rules.pdps-short'), ruleSet.pdp_count],
                ].map(([label, value]) => (
                  <Box key={label as string}>
                    <Text fontSize="18px" fontWeight={700} color="ink.900">
                      {value ?? 0}
                    </Text>
                    <Text fontSize="12px" color="ink.500">
                      {label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default PdpRulesPage;
