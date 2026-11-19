import React, { useEffect, useMemo, useState } from 'react';
import { Box, Flex, HStack, Progress, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardHeader, EmptyState, PageHeader, ScorePill, SkeletonCards, StatCard } from '@/components/ui';
import { PeriodFilter, PeriodKey, RegionFilter, periodOf } from '@/components/Filters';
import RdcService from '@/services/rdc';
import { RdcDashboard } from '@/types/rdc';
import { APPRECIATIONS, appreciationLabel, formatNumber, functionLabel } from '@/common/labels';
import { alertError } from '@/common/alert';
import { useUserContext } from '@/contexts/UserContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const INK = '#576375';
const GRID = '#EEF0F3';
// Global scores 1 to 5: one hue, light to dark (sequential)
const SCORE_RAMP = ['#C2E0FF', '#99CBFF', '#5C9DE6', '#3373CC', '#0052A3'];

const baseOptions = (horizontal = false): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: horizontal ? 'y' : 'x',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111417',
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: 'Noto Sans', weight: 'bold' },
      bodyFont: { family: 'Noto Sans' },
    },
  },
  scales: {
    x: {
      grid: { color: horizontal ? GRID : 'transparent' },
      border: { display: false },
      ticks: { color: INK, font: { family: 'Noto Sans', size: 12 }, precision: 0 },
    },
    y: {
      grid: { color: horizontal ? 'transparent' : GRID },
      border: { display: false },
      ticks: { color: INK, font: { family: 'Noto Sans', size: 12 }, precision: 0 },
      beginAtZero: true,
    },
  },
});

const MiniBar: React.FC<{ value: number; max: number }> = ({ value, max }) => (
  <Progress value={max ? (value / max) * 100 : 0} size="xs" borderRadius="full" bg="ink.100" w="80px" />
);

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const [regionId, setRegionId] = useState<string | undefined>(user?.region_id);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('school-year');
  const [data, setData] = useState<RdcDashboard>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    RdcService.getDashboard(regionId, periodOf(periodKey))
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        if (!cancelled) alertError(error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId, periodKey]);

  const monthLabel = (month: string) =>
    new Date(`${month}-01T00:00:00`).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', {
      month: 'short',
      year: '2-digit',
    });

  const scoresChart = useMemo(() => {
    if (!data) return undefined;
    const rows = data.bySubDomain;
    return {
      labels: rows.map((row) => `${row.code} · ${row.title}`),
      datasets: [1, 2, 3, 4, 5].map((score, index) => ({
        label: t('dash.score-n', { value: score }),
        data: rows.map((row) => {
          const total = row.score_1 + row.score_2 + row.score_3 + row.score_4 + row.score_5;
          return total ? Math.round(((row as any)[`score_${score}`] / total) * 100) : 0;
        }),
        backgroundColor: SCORE_RAMP[index],
        borderColor: '#FFFFFF',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 22,
      })),
    };
  }, [data, t]);

  const totals = data?.totals;
  const appreciationTotal = data?.appreciations.reduce((sum, item) => sum + item.count, 0) || 0;
  const maxFunction = Math.max(1, ...(data?.byFunction.map((row) => row.sessions) || [0]));
  const maxArea = Math.max(1, ...(data?.byArea.map((row) => row.sessions) || [0]));
  const empty = !isLoading && totals?.sessions === 0;

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.steering')}
        title={t('dash.title')}
        subtitle={t('dash.subtitle')}
        actions={
          <Flex gap={2} direction={{ base: 'column', md: 'row' }} w={{ base: 'full', md: 'auto' }}>
            <RegionFilter onChange={setRegionId} />
            <PeriodFilter value={periodKey} onChange={setPeriodKey} />
          </Flex>
        }
      />

      {isLoading && !data ? (
        <SkeletonCards count={4} />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
          <StatCard
            icon="clipboard-notes"
            label={t('dash.kpi.sessions')}
            value={formatNumber(totals?.closed_sessions, 0)}
            hint={t('dash.kpi.sessions-hint', { count: (totals?.sessions || 0) - (totals?.closed_sessions || 0) })}
            isLoading={isLoading}
          />
          <StatCard
            icon="graduation-cap"
            tone="teal"
            label={t('dash.kpi.teachers')}
            value={formatNumber(totals?.teachers, 0)}
            hint={t('dash.kpi.schools', { count: totals?.schools || 0 })}
            isLoading={isLoading}
          />
          <StatCard
            icon="user-circle"
            tone="violet"
            label={t('dash.kpi.observers')}
            value={formatNumber(totals?.observers, 0)}
            hint={t('dash.kpi.circles', {
              count: data?.learningCircles.sessions || 0,
              participants: data?.learningCircles.participants || 0,
            })}
            isLoading={isLoading}
          />
          <StatCard
            icon="award"
            tone="green"
            label={t('dash.kpi.average')}
            value={totals?.average_score ? `${formatNumber(totals.average_score)} / 5` : '—'}
            hint={t('dash.kpi.pdps', { validated: data?.pdps.validated || 0, total: data?.pdps.total || 0 })}
            isLoading={isLoading}
          />
        </SimpleGrid>
      )}

      {empty ? (
        <Card mt={6}>
          <EmptyState icon="chart-line" title={t('dash.empty')} description={t('dash.empty-description')} />
        </Card>
      ) : (
        data && (
          <>
            <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4} mt={4}>
              <Card gridColumn={{ xl: 'span 2' }}>
                <CardHeader title={t('dash.months')} subtitle={t('dash.months-subtitle')} />
                <Box px={5} pb={5} h="260px">
                  <Bar
                    options={baseOptions()}
                    data={{
                      labels: data.months.map((row) => monthLabel(row.month)),
                      datasets: [
                        {
                          label: t('dash.kpi.sessions'),
                          data: data.months.map((row) => row.sessions),
                          backgroundColor: '#3373CC',
                          hoverBackgroundColor: '#0052A3',
                          borderRadius: 4,
                          maxBarThickness: 36,
                        },
                      ],
                    }}
                  />
                </Box>
              </Card>

              <Card>
                <CardHeader title={t('dash.appreciations')} subtitle={t('dash.appreciations-subtitle')} />
                <Box px={5} pb={5}>
                  {APPRECIATIONS.map((code) => {
                    const count = data.appreciations.find((item) => item.appreciation === code)?.count || 0;
                    const share = appreciationTotal ? (count / appreciationTotal) * 100 : 0;
                    return (
                      <Box key={code} py={2}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="14px" color="ink.800" fontWeight={500}>
                            {appreciationLabel(code)}
                          </Text>
                          <Text fontSize="13px" color="ink.600">
                            {count} · {Math.round(share)} %
                          </Text>
                        </HStack>
                        <Progress value={share} size="sm" borderRadius="full" bg="ink.100" />
                      </Box>
                    );
                  })}
                  {appreciationTotal === 0 && (
                    <Text fontSize="13px" color="ink.500" pt={2}>
                      {t('dash.no-appreciation')}
                    </Text>
                  )}
                </Box>
              </Card>
            </SimpleGrid>

            <Card mt={4}>
              <CardHeader title={t('dash.scores')} subtitle={t('dash.scores-subtitle')} />
              <HStack px={5} spacing={4} flexWrap="wrap" aria-hidden>
                {SCORE_RAMP.map((color, index) => (
                  <HStack key={color} spacing={1.5}>
                    <Box w="12px" h="12px" borderRadius="3px" bg={color} />
                    <Text fontSize="12px" color="ink.600">
                      {t('dash.score-n', { value: index + 1 })}
                    </Text>
                  </HStack>
                ))}
              </HStack>
              <Box px={5} pb={5} pt={2} h={`${Math.max(180, data.bySubDomain.length * 44 + 40)}px`}>
                {scoresChart && (
                  <Bar
                    data={scoresChart}
                    options={{
                      ...baseOptions(true),
                      plugins: {
                        ...baseOptions(true).plugins,
                        tooltip: {
                          ...baseOptions(true).plugins?.tooltip,
                          callbacks: { label: (item) => `${item.dataset.label} : ${item.formattedValue} %` },
                        },
                      },
                      scales: {
                        x: { ...baseOptions(true).scales?.x, stacked: true, max: 100, ticks: { color: INK, callback: (value) => `${value} %` } },
                        y: { ...baseOptions(true).scales?.y, stacked: true },
                      },
                    }}
                  />
                )}
              </Box>
              <Box px={5} pb={5} overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('dash.sub-domain')}</Th>
                      <Th isNumeric>{t('dash.scored')}</Th>
                      <Th isNumeric>{t('dash.average')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.bySubDomain.map((row) => (
                      <Tr key={row.id}>
                        <Td>
                          <Text as="span" fontWeight={700} mr={2}>
                            {row.code}
                          </Text>
                          {row.title}
                        </Td>
                        <Td isNumeric>{row.count}</Td>
                        <Td isNumeric>
                          <ScorePill value={row.average} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Card>

            <SimpleGrid columns={{ base: 1, '2xl': 2 }} spacing={4} mt={4}>
              <Card>
                <CardHeader title={t('dash.by-function')} subtitle={t('dash.by-function-subtitle')} />
                <Box px={2} pb={4} overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>{t('dash.function')}</Th>
                        <Th isNumeric>{t('dash.kpi.sessions')}</Th>
                        <Th isNumeric>{t('dash.observers')}</Th>
                        <Th isNumeric>{t('dash.teachers')}</Th>
                        <Th isNumeric>{t('dash.average')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.byFunction.map((row) => (
                        <Tr key={row.function}>
                          <Td fontWeight={600}>{functionLabel(row.function)}</Td>
                          <Td isNumeric>
                            <HStack justify="flex-end" spacing={3}>
                              <MiniBar value={row.sessions} max={maxFunction} />
                              <Text as="span" minW="24px">
                                {row.sessions}
                              </Text>
                            </HStack>
                          </Td>
                          <Td isNumeric>{row.observers}</Td>
                          <Td isNumeric>{row.teachers}</Td>
                          <Td isNumeric>
                            <ScorePill value={row.average} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Card>

              <Card>
                <CardHeader title={t('dash.by-area')} subtitle={t('dash.by-area-subtitle')} />
                <Box px={2} pb={4} overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>{t('dash.area')}</Th>
                        <Th isNumeric>{t('dash.kpi.sessions')}</Th>
                        <Th isNumeric>{t('dash.teachers')}</Th>
                        <Th isNumeric>{t('dash.average')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.byArea.map((row) => (
                        <Tr key={row.id}>
                          <Td fontWeight={600}>{row.name}</Td>
                          <Td isNumeric>
                            <HStack justify="flex-end" spacing={3}>
                              <MiniBar value={row.sessions} max={maxArea} />
                              <Text as="span" minW="24px">
                                {row.sessions}
                              </Text>
                            </HStack>
                          </Td>
                          <Td isNumeric>{row.teachers}</Td>
                          <Td isNumeric>
                            <ScorePill value={row.average} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Card>

            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4} mt={4}>
              <Card>
                <CardHeader title={t('dash.behaviours')} subtitle={t('dash.behaviours-subtitle')} />
                <Box px={5} pb={5}>
                  {data.behaviours.length === 0 ? (
                    <Text fontSize="13px" color="ink.500">
                      {t('dash.no-pdp')}
                    </Text>
                  ) : (
                    data.behaviours.map((row, index) => (
                      <HStack key={row.id} py={2.5} spacing={3} borderTop={index ? '1px solid' : 'none'} borderColor="ink.100">
                        <Text w="44px" flex="none" fontSize="13px" fontWeight={700} color="brand.600">
                          {row.code}
                        </Text>
                        <Text flex={1} fontSize="14px" color="ink.800">
                          {row.title}
                        </Text>
                        <Text fontSize="13px" color="ink.600" whiteSpace="nowrap">
                          {t('dash.objectives', { count: row.count })}
                        </Text>
                      </HStack>
                    ))
                  )}
                </Box>
              </Card>

              <Card>
                <CardHeader title={t('dash.checklist')} subtitle={t('dash.checklist-subtitle')} />
                <Box px={5} pb={5}>
                  {data.checklist.map((row) => {
                    const answered = row.yes + row.no;
                    const share = answered ? (row.yes / answered) * 100 : 0;
                    return (
                      <Box key={row.id} py={1.5}>
                        <HStack justify="space-between" mb={1} spacing={3}>
                          <Text fontSize="13px" color="ink.800" noOfLines={1}>
                            {row.code}. {row.document_name}
                          </Text>
                          <Text fontSize="12px" color="ink.600" whiteSpace="nowrap">
                            {answered ? `${Math.round(share)} %` : '—'}
                          </Text>
                        </HStack>
                        <Progress value={share} size="xs" borderRadius="full" bg="ink.100" />
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </SimpleGrid>
          </>
        )
      )}
    </Box>
  );
};

export default DashboardPage;
