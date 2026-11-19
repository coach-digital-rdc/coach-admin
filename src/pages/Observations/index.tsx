import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Select, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader, ScorePill, StatusBadge } from '@/components/ui';
import { RegionFilter } from '@/components/Filters';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { RdcSession } from '@/types/rdc';
import { alertError } from '@/common/alert';
import { downloadWorkbook } from '@/common/xlsx';
import {
  FUNCTIONS,
  appreciationLabel,
  formatDate,
  fullName,
  functionLabel,
  isClosed,
  sessionStatus,
} from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';

const STATUS_TONES: { [status: string]: 'green' | 'yellow' | 'brand' | 'gray' } = {
  COMPLETED: 'green',
  PREPARATION: 'gray',
  OBSERVATION: 'brand',
  EVALUATION: 'yellow',
};

export const SessionStatusBadge: React.FC<{ session: RdcSession }> = ({ session }) => {
  const { t } = useTranslation();
  const status = sessionStatus(session);
  return <StatusBadge tone={STATUS_TONES[status] || 'gray'}>{t(`rdc.status.${status}`, { defaultValue: status })}</StatusBadge>;
};

const sessionFunction = (session: RdcSession) => session.observer_function || session.coach?.function;

// "Séances d'observation": every session sent by the devices, with its results
const ObservationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [regionId, setRegionId] = useState<string | undefined>(user?.region_id);
  const [sessions, setSessions] = useState<RdcSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [observerFunction, setObserverFunction] = useState('');

  useEffect(() => {
    setIsLoading(true);
    RdcService.getSessions(regionId)
      .then(setSessions)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, [regionId]);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (session) =>
          (!status || (status === 'COMPLETED' ? isClosed(session) : !isClosed(session))) &&
          (!observerFunction || sessionFunction(session) === observerFunction),
      ),
    [sessions, status, observerFunction],
  );

  const columns: DataColumn<RdcSession>[] = [
    {
      key: 'date',
      header: t('sessions.date'),
      render: (session) => (
        <Text whiteSpace="nowrap">{formatDate(session.completed_at || session.observation_started_at || session.created_at)}</Text>
      ),
      sortValue: (session) => session.completed_at || session.observation_started_at || session.created_at || '',
    },
    {
      key: 'teacher',
      header: t('sessions.teacher'),
      render: (session) => (
        <Box>
          <Text fontWeight={600} color="ink.900">
            {fullName(session.teacher)}
          </Text>
          <Text fontSize="13px" color="ink.500">
            {session.subject || session.teacher?.subject || '—'}
          </Text>
        </Box>
      ),
      sortValue: (session) => fullName(session.teacher),
    },
    {
      key: 'school',
      header: t('sessions.school'),
      render: (session) => (
        <Box>
          <Text>{session.school?.name || '—'}</Text>
          <Text fontSize="13px" color="ink.500">
            {session.school?.region?.name}
          </Text>
        </Box>
      ),
      sortValue: (session) => session.school?.name,
      hideBelow: 'md',
    },
    {
      key: 'observer',
      header: t('sessions.observer'),
      render: (session) => (
        <Box>
          <Text>{fullName(session.coach)}</Text>
          <Text fontSize="13px" color="ink.500">
            {functionLabel(sessionFunction(session))}
          </Text>
        </Box>
      ),
      sortValue: (session) => fullName(session.coach),
      hideBelow: 'lg',
    },
    {
      key: 'status',
      header: t('sessions.status'),
      render: (session) => <SessionStatusBadge session={session} />,
      sortValue: (session) => sessionStatus(session),
    },
    {
      key: 'average',
      header: t('sessions.average'),
      render: (session) => <ScorePill value={session.average_score} />,
      sortValue: (session) => session.average_score ?? null,
      align: 'right',
    },
    {
      key: 'appreciation',
      header: t('sessions.appreciation'),
      render: (session) => appreciationLabel(session.appreciation),
      sortValue: (session) => session.appreciation,
      hideBelow: 'lg',
    },
    {
      key: 'open',
      header: '',
      render: () => <Icon name="angle-right" size={20} color="#9AA2AC" />,
      width: '40px',
    },
  ];

  const exportList = () =>
    downloadWorkbook(t('sessions.file-name'), [
      {
        name: t('sessions.title'),
        rows: filtered.map((session) => ({
          [t('sessions.date')]: formatDate(session.completed_at || session.observation_started_at || session.created_at),
          [t('sessions.status')]: t(`rdc.status.${sessionStatus(session)}`, { defaultValue: sessionStatus(session) }),
          [t('sessions.teacher')]: fullName(session.teacher),
          [t('sessions.subject')]: session.subject || session.teacher?.subject || '',
          [t('sessions.school')]: session.school?.name || '',
          [t('sessions.region')]: session.school?.region?.name || '',
          [t('sessions.observer')]: fullName(session.coach),
          [t('sessions.function')]: functionLabel(sessionFunction(session)),
          [t('sessions.average')]: session.average_score ? Number(session.average_score.toFixed(2)) : '',
          [t('sessions.suggested-appreciation')]: session.suggested_appreciation
            ? appreciationLabel(session.suggested_appreciation)
            : '',
          [t('sessions.appreciation')]: session.appreciation ? appreciationLabel(session.appreciation) : '',
          [t('sessions.pdp')]: session.pdp_status ? t(`rdc.pdp-status.${session.pdp_status}`) : '',
        })),
      },
    ]);

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.observations')}
        title={t('sessions.title')}
        subtitle={t('sessions.subtitle')}
        actions={
          <Button
            variant="outline"
            leftIcon={<Icon name="download-alt" size={18} color="#3373CC" />}
            onClick={exportList}
            isDisabled={filtered.length === 0}
          >
            {t('ui.export-xlsx')}
          </Button>
        }
      />
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        rowKey={(session) => session.id}
        onRowClick={(session) => navigate(`/admin/sessions/${session.id}`)}
        searchText={(session) =>
          [fullName(session.teacher), fullName(session.coach), session.school?.name, session.subject].join(' ')
        }
        searchPlaceholder={t('sessions.search')}
        initialSort={{ key: 'date', direction: 'desc' }}
        emptyIcon="clipboard-notes"
        emptyTitle={t('sessions.empty')}
        emptyDescription={t('sessions.empty-description')}
        toolbar={
          <>
            <RegionFilter onChange={setRegionId} />
            <Select w={{ base: 'full', md: '180px' }} value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('sessions.status') || ''}>
              <option value="">{t('sessions.all-status')}</option>
              <option value="COMPLETED">{t('rdc.status.COMPLETED')}</option>
              <option value="OPEN">{t('sessions.open')}</option>
            </Select>
            <Select
              w={{ base: 'full', md: '220px' }}
              value={observerFunction}
              onChange={(event) => setObserverFunction(event.target.value)}
              aria-label={t('sessions.function') || ''}
            >
              <option value="">{t('sessions.all-functions')}</option>
              {FUNCTIONS.map((code) => (
                <option key={code} value={code}>
                  {functionLabel(code)}
                </option>
              ))}
            </Select>
          </>
        }
      />
    </Box>
  );
};

export default ObservationsPage;
