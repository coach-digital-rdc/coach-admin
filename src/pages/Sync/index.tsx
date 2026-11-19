import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader, StatCard, StatusBadge } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import SyncService from '@/services/sync';
import { ISync } from '@/types';
import { alertError } from '@/common/alert';
import { downloadWorkbook } from '@/common/xlsx';
import { formatDate } from '@/common/labels';

// Same delay as the warning of the mobile application (B20)
const OUTDATED_DAYS = 7;
// Synchronisations of the first versions were saved without their date
const daysSince = (date?: Date | string | null) =>
  date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : null;

type Device = ISync & { count?: number };

// Devices that synchronised with the server, and when they did it last
const SyncsPage: React.FC = () => {
  const { t } = useTranslation();
  const [syncs, setSyncs] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SyncService.getSyncs()
      .then(setSyncs)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, []);

  const outdated = syncs.filter((sync) => (daysSince(sync.lastPulledAt) ?? OUTDATED_DAYS) >= OUTDATED_DAYS).length;

  const columns: DataColumn<Device>[] = [
    {
      key: 'model',
      header: t('sync.table.model'),
      render: (sync) => (
        <HStack spacing={3}>
          <Icon name="mobile-android" size={20} color="#576375" />
          <Box>
            <Text fontWeight={600}>{sync.model || '—'}</Text>
            <Text fontSize="12px" color="ink.500" fontFamily="mono">
              {sync.deviceId}
            </Text>
          </Box>
        </HStack>
      ),
      sortValue: (sync) => sync.model,
    },
    { key: 'api', header: t('sync.table.android-version'), render: (sync) => sync.apiLevel || '—', sortValue: (sync) => Number(sync.apiLevel) || 0 },
    {
      key: 'last',
      header: t('sync.table.last-update'),
      render: (sync) => formatDate(sync.lastPulledAt, true),
      sortValue: (sync) => (sync.lastPulledAt ? new Date(sync.lastPulledAt).getTime() : null),
    },
    { key: 'count', header: t('syncs.count'), render: (sync) => sync.count ?? 1, sortValue: (sync) => sync.count ?? 1, align: 'right' },
    {
      key: 'state',
      header: t('syncs.state'),
      render: (sync) => {
        const days = daysSince(sync.lastPulledAt);
        if (days === null) return <StatusBadge tone="gray">{t('syncs.unknown')}</StatusBadge>;
        return days >= OUTDATED_DAYS ? (
          <StatusBadge tone="yellow">{t('syncs.outdated', { count: days })}</StatusBadge>
        ) : (
          <StatusBadge tone="green">{t('syncs.up-to-date')}</StatusBadge>
        );
      },
      sortValue: (sync) => daysSince(sync.lastPulledAt),
    },
  ];

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.administration')}
        title={t('menu.syncs')}
        subtitle={t('syncs.subtitle')}
        actions={
          <Button
            variant="outline"
            leftIcon={<Icon name="download-alt" size={18} color="#3373CC" />}
            isDisabled={!syncs.length}
            onClick={() =>
              downloadWorkbook(t('syncs.file-name'), [
                {
                  name: t('menu.syncs'),
                  rows: syncs.map((sync) => ({
                    [t('sync.table.model')]: sync.model,
                    [t('sync.table.device-id')]: sync.deviceId,
                    [t('sync.table.android-version')]: sync.apiLevel,
                    [t('sync.table.last-update')]: formatDate(sync.lastPulledAt, true),
                    [t('syncs.count')]: sync.count ?? 1,
                  })),
                },
              ])
            }
          >
            {t('ui.export-xlsx')}
          </Button>
        }
      />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
        <StatCard icon="mobile-android" label={t('syncs.devices')} value={syncs.length} isLoading={isLoading} />
        <StatCard icon="sync-slash" tone="yellow" label={t('syncs.devices-outdated', { days: OUTDATED_DAYS })} value={outdated} isLoading={isLoading} />
      </SimpleGrid>
      <DataTable
        data={syncs}
        columns={columns}
        isLoading={isLoading}
        rowKey={(sync) => sync.id || sync.deviceId}
        searchText={(sync) => `${sync.model} ${sync.deviceId}`}
        initialSort={{ key: 'last', direction: 'desc' }}
        emptyIcon="sync"
      />
    </Box>
  );
};

export default SyncsPage;
