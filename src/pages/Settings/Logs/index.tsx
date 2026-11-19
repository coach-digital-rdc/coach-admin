import React, { useEffect, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable } from '@/components/ui';
import LogsService from '@/services/logs';
import { ILogs } from '@/types';
import { alertError } from '@/common/alert';
import { formatDate } from '@/common/labels';

// Journal of the actions of the administration users
const Logs: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ILogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    LogsService.getLogs()
      .then(setLogs)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, []);

  const columns: DataColumn<ILogs>[] = [
    {
      key: 'date',
      header: t('settings.tabs.logs.table.date'),
      render: (log) => <Text whiteSpace="nowrap">{formatDate(log.created_at, true)}</Text>,
      sortValue: (log) => log.created_at,
      width: '180px',
    },
    { key: 'user', header: t('settings.tabs.logs.table.user'), render: (log) => log.user?.name || '—', sortValue: (log) => log.user?.name },
    {
      key: 'action',
      header: t('settings.tabs.logs.table.action'),
      render: (log) => (
        <Text fontFamily="mono" fontSize="13px" color="ink.700">
          {log.description}
        </Text>
      ),
      sortValue: (log) => log.description,
    },
  ];

  return (
    <DataTable
      data={logs}
      columns={columns}
      isLoading={isLoading}
      rowKey={(log) => log.id}
      searchText={(log) => `${log.user?.name} ${log.description}`}
      initialSort={{ key: 'date', direction: 'desc' }}
      pageSize={50}
      emptyIcon="receipt-alt"
    />
  );
};

export default Logs;
