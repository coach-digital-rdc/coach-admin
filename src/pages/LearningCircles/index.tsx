import React, { useEffect, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader, StatusBadge } from '@/components/ui';
import { RegionFilter } from '@/components/Filters';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { LearningCircle } from '@/types/rdc';
import { alertError } from '@/common/alert';
import { formatDate } from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';

// Units of the learning circles, as in the mobile application (src/data/tlc.ts)
export const TLC_UNITS: { [id: string]: { topic: string; behaviour: string } } = {
  '1': { topic: 'Utiliser un langage positif', behaviour: '2.1.2' },
  '2': { topic: 'Énoncer clairement les objectifs de la séquence', behaviour: '3.1.5' },
  '3': { topic: 'Vérifier la compréhension des apprenant.e.s', behaviour: '3.1.7' },
};

export const participantsOf = (circle: LearningCircle): string[] => {
  try {
    return JSON.parse(circle.participants || '[]');
  } catch {
    return [];
  }
};

const Rating: React.FC<{ value?: string }> = ({ value }) => {
  const rating = Number(value) || 0;
  return (
    <HStack spacing={0.5} aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon key={star} name="star-solid" size={16} color={star <= rating ? '#E89F0C' : '#DCE0E5'} />
      ))}
    </HStack>
  );
};

// Learning circles run by the observers with the teachers of a school (B22)
const LearningCirclesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [regionId, setRegionId] = useState<string | undefined>(user?.region_id);
  const [circles, setCircles] = useState<LearningCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    RdcService.getLearningCircles(regionId)
      .then(setCircles)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, [regionId]);

  const columns: DataColumn<LearningCircle>[] = [
    {
      key: 'date',
      header: t('circles.date'),
      render: (circle) => formatDate(circle.created_at),
      sortValue: (circle) => circle.created_at,
    },
    {
      key: 'unit',
      header: t('circles.unit'),
      render: (circle) => (
        <Box>
          <Text fontWeight={600}>{t('circles.unit-n', { value: circle.unit_id })}</Text>
          <Text fontSize="13px" color="ink.500">
            {TLC_UNITS[circle.unit_id]?.topic}
          </Text>
        </Box>
      ),
      sortValue: (circle) => circle.unit_id,
    },
    {
      key: 'school',
      header: t('sessions.school'),
      render: (circle) => circle.school_name,
      sortValue: (circle) => circle.school_name,
    },
    {
      key: 'observer',
      header: t('sessions.observer'),
      render: (circle) => circle.coach_name || '—',
      sortValue: (circle) => circle.coach_name,
      hideBelow: 'md',
    },
    {
      key: 'participants',
      header: t('circles.participants'),
      render: (circle) => (
        <Box>
          <StatusBadge tone="brand">{circle.participants_count ?? participantsOf(circle).length}</StatusBadge>
          <Text fontSize="12px" color="ink.500" mt={1} noOfLines={1} maxW="260px">
            {participantsOf(circle).join(', ')}
          </Text>
        </Box>
      ),
      sortValue: (circle) => circle.participants_count ?? 0,
    },
    {
      key: 'rating',
      header: t('circles.rating'),
      render: (circle) => <Rating value={circle.evaluation} />,
      sortValue: (circle) => Number(circle.evaluation) || 0,
    },
  ];

  return (
    <Box>
      <PageHeader eyebrow={t('menu.observations')} title={t('circles.title')} subtitle={t('circles.subtitle')} />
      <DataTable
        data={circles}
        columns={columns}
        isLoading={isLoading}
        rowKey={(circle) => circle.id}
        searchText={(circle) => `${circle.school_name} ${circle.coach_name} ${participantsOf(circle).join(' ')}`}
        initialSort={{ key: 'date', direction: 'desc' }}
        emptyIcon="users-alt"
        emptyTitle={t('circles.empty')}
        emptyDescription={t('circles.empty-description')}
        toolbar={<RegionFilter onChange={setRegionId} />}
      />
    </Box>
  );
};

export default LearningCirclesPage;
