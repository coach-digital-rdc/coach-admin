import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
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
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader, StatusBadge } from '@/components/ui';
import { RegionFilter } from '@/components/Filters';
import Icon from '@/components/Base/Icon';
import CoachService from '@/services/coach';
import { RdcCoach, RdcSchool } from '@/types/rdc';
import { alertError, toast } from '@/common/alert';
import { downloadWorkbook } from '@/common/xlsx';
import { FUNCTIONS, formatDate, fullName, functionLabel } from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';
import _axios from '@/services';

export type Observer = RdcCoach & {
  coachSchools?: { school_id: string; school?: RdcSchool }[];
  sessions_count?: number;
  teachers_count?: number;
  last_session?: string | null;
};

const schoolsOf = (observer: Observer) =>
  (observer.coachSchools || []).map((item) => item.school).filter((school): school is RdcSchool => !!school);

// Observers of the DRC (B21): inspectors, pedagogical advisors, school heads and peers, with
// their profile shown on the observation sheet and the schools they follow
const ObserversPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [regionId, setRegionId] = useState<string | undefined>(user?.region_id);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [observerFunction, setObserverFunction] = useState('');
  const [editing, setEditing] = useState<Observer | null>();

  const load = () => {
    setIsLoading(true);
    _axios
      .get<Observer[]>('coach', { params: { regionId } })
      .then((response) => setObservers(response.data))
      .catch(alertError)
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [regionId]);

  const filtered = useMemo(
    () => observers.filter((observer) => !observerFunction || (observer.function || 'UNKNOWN') === observerFunction),
    [observers, observerFunction],
  );

  const columns: DataColumn<Observer>[] = [
    {
      key: 'name',
      header: t('observers.name'),
      render: (observer) => (
        <HStack spacing={3}>
          <Avatar size="sm" name={fullName(observer)} bg="brand.100" color="brand.700" fontWeight={700} />
          <Box>
            <Text fontWeight={600} color="ink.900">
              {fullName(observer)}
            </Text>
            <Text fontSize="13px" color="ink.500">
              {observer.email}
            </Text>
          </Box>
        </HStack>
      ),
      sortValue: (observer) => fullName(observer),
    },
    {
      key: 'function',
      header: t('sessions.function'),
      render: (observer) =>
        observer.function ? (
          <StatusBadge tone="brand">{functionLabel(observer.function)}</StatusBadge>
        ) : (
          <StatusBadge tone="yellow">{functionLabel()}</StatusBadge>
        ),
      sortValue: (observer) => functionLabel(observer.function),
    },
    {
      key: 'station',
      header: t('observers.duty-station'),
      render: (observer) => observer.duty_station || '—',
      sortValue: (observer) => observer.duty_station,
      hideBelow: 'lg',
    },
    {
      key: 'schools',
      header: t('observers.schools'),
      render: (observer) => {
        const schools = schoolsOf(observer);
        return (
          <Box maxW="260px">
            <Text>{t('observers.schools-count', { count: schools.length })}</Text>
            <Text fontSize="12px" color="ink.500" noOfLines={1}>
              {schools.map((school) => school.name).join(', ')}
            </Text>
          </Box>
        );
      },
      sortValue: (observer) => schoolsOf(observer).length,
      hideBelow: 'md',
    },
    {
      key: 'sessions',
      header: t('observers.sessions'),
      render: (observer) => observer.sessions_count || 0,
      sortValue: (observer) => observer.sessions_count || 0,
      align: 'right',
    },
    {
      key: 'last',
      header: t('observers.last-session'),
      render: (observer) => formatDate(observer.last_session),
      sortValue: (observer) => observer.last_session || '',
      hideBelow: 'lg',
    },
    {
      key: 'edit',
      header: '',
      width: '40px',
      render: () => <Icon name="angle-right" size={20} color="#9AA2AC" />,
    },
  ];

  const exportList = () =>
    downloadWorkbook(t('observers.file-name'), [
      {
        name: t('observers.title'),
        rows: filtered.map((observer) => ({
          [t('observers.surname')]: observer.surname || '',
          [t('observers.first-name')]: observer.name,
          [t('observers.sex')]: observer.sex || '',
          [t('sessions.function')]: functionLabel(observer.function),
          [t('observers.duty-station')]: observer.duty_station || '',
          [t('observers.postal-box')]: observer.postal_box || '',
          [t('observers.email')]: observer.email || '',
          [t('observers.phone')]: observer.phone || '',
          [t('observers.schools')]: schoolsOf(observer)
            .map((school) => school.name)
            .join(', '),
          [t('observers.sessions')]: observer.sessions_count || 0,
          [t('observers.teachers')]: observer.teachers_count || 0,
          [t('observers.last-session')]: formatDate(observer.last_session),
        })),
      },
    ]);

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.people')}
        title={t('observers.title')}
        subtitle={t('observers.subtitle')}
        actions={
          <>
            <Button variant="outline" leftIcon={<Icon name="download-alt" size={18} color="#3373CC" />} onClick={exportList} isDisabled={!filtered.length}>
              {t('ui.export-xlsx')}
            </Button>
            <Button leftIcon={<Icon name="plus" size={18} color="#FFFFFF" />} onClick={() => setEditing(null)}>
              {t('observers.new')}
            </Button>
          </>
        }
      />
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        rowKey={(observer) => observer.id}
        onRowClick={setEditing}
        searchText={(observer) =>
          [fullName(observer), observer.email, observer.duty_station, ...schoolsOf(observer).map((school) => school.name)].join(' ')
        }
        searchPlaceholder={t('observers.search')}
        initialSort={{ key: 'name', direction: 'asc' }}
        emptyIcon="user-circle"
        emptyTitle={t('observers.empty')}
        emptyDescription={t('observers.empty-description')}
        toolbar={
          <>
            <RegionFilter onChange={setRegionId} />
            <Select w={{ base: 'full', md: '230px' }} value={observerFunction} onChange={(event) => setObserverFunction(event.target.value)} aria-label={t('sessions.function')}>
              <option value="">{t('sessions.all-functions')}</option>
              {[...FUNCTIONS, 'UNKNOWN'].map((code) => (
                <option key={code} value={code}>
                  {functionLabel(code)}
                </option>
              ))}
            </Select>
          </>
        }
      />
      <ObserverDrawer
        observer={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          load();
        }}
      />
    </Box>
  );
};

type FormState = Pick<RdcCoach, 'name' | 'surname' | 'email' | 'phone' | 'sex' | 'function' | 'duty_station' | 'postal_box'>;
const EMPTY: FormState = { name: '', surname: '', email: '', phone: '', sex: '', function: '', duty_station: '', postal_box: '' };

// observer: null for a new observer, undefined when the drawer is closed
const ObserverDrawer: React.FC<{ observer?: Observer | null; onClose: () => void; onSaved: () => void }> = ({
  observer,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
    setForm(observer ? { ...EMPTY, ...Object.fromEntries(Object.entries(observer).filter(([key]) => key in EMPTY)) } : EMPTY);
  }, [observer]);

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: event.target.value });

  const invalid = {
    name: !form.name?.trim(),
    email: !/^\S+@\S+\.\S+$/.test(form.email || ''),
  };

  const save = async () => {
    setSubmitted(true);
    if (invalid.name || invalid.email) return;
    setIsSaving(true);
    try {
      const data = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value?.trim() || null]));
      if (observer) await CoachService.updateCoach({ ...data, id: observer.id } as any);
      else await CoachService.saveCoach(data as any);
      toast.success(t(observer ? 'observers.saved' : 'observers.created'));
      onSaved();
    } catch (error) {
      alertError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const schools = observer ? schoolsOf(observer) : [];

  return (
    <Drawer isOpen={observer !== undefined} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton mt={2} />
        <DrawerHeader>{observer ? fullName(observer) : t('observers.new')}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={5} align="stretch">
            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired isInvalid={submitted && invalid.name}>
                <FormLabel fontSize="14px">{t('observers.first-name')}</FormLabel>
                <Input value={form.name || ''} onChange={set('name')} />
                <FormErrorMessage>{t('observers.required')}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="14px">{t('observers.surname')}</FormLabel>
                <Input value={form.surname || ''} onChange={set('surname')} />
              </FormControl>
            </SimpleGrid>
            <FormControl isRequired isInvalid={submitted && invalid.email}>
              <FormLabel fontSize="14px">{t('observers.email')}</FormLabel>
              <Input type="email" value={form.email || ''} onChange={set('email')} />
              <FormHelperText fontSize="12px">{t('observers.email-help')}</FormHelperText>
              <FormErrorMessage>{t('observers.invalid-email')}</FormErrorMessage>
            </FormControl>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="14px">{t('observers.phone')}</FormLabel>
                <Input type="tel" value={form.phone || ''} onChange={set('phone')} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="14px">{t('observers.sex')}</FormLabel>
                <Select value={form.sex || ''} onChange={set('sex')}>
                  <option value="">—</option>
                  <option value="F">{t('observers.sexes.F')}</option>
                  <option value="M">{t('observers.sexes.M')}</option>
                </Select>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel fontSize="14px">{t('sessions.function')}</FormLabel>
              <Select value={form.function || ''} onChange={set('function')}>
                <option value="">{functionLabel()}</option>
                {FUNCTIONS.map((code) => (
                  <option key={code} value={code}>
                    {functionLabel(code)}
                  </option>
                ))}
              </Select>
              <FormHelperText fontSize="12px">{t('observers.function-help')}</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="14px">{t('observers.duty-station')}</FormLabel>
              <Input value={form.duty_station || ''} onChange={set('duty_station')} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="14px">{t('observers.postal-box')}</FormLabel>
              <Input value={form.postal_box || ''} onChange={set('postal_box')} />
            </FormControl>

            {observer && (
              <Box pt={2}>
                <Text fontSize="14px" fontWeight={700} color="ink.900">
                  {t('observers.scope')}
                </Text>
                <Text fontSize="12px" color="ink.500" mb={2}>
                  {t('observers.scope-help')}
                </Text>
                {schools.length === 0 ? (
                  <Text fontSize="13px" color="ink.500">
                    {t('observers.no-school')}
                  </Text>
                ) : (
                  schools.map((school) => (
                    <HStack key={school.id} py={2} borderTop="1px solid" borderColor="ink.100" spacing={3}>
                      <Icon name="university" size={18} color="#576375" />
                      <Box flex={1}>
                        <Text fontSize="14px">{school.name}</Text>
                        <Text fontSize="12px" color="ink.500">
                          {school.region?.name}
                        </Text>
                      </Box>
                    </HStack>
                  ))
                )}
                <SimpleGrid columns={3} spacing={3} mt={4}>
                  {[
                    [t('observers.sessions'), observer.sessions_count || 0],
                    [t('observers.teachers'), observer.teachers_count || 0],
                    [t('observers.last-session'), formatDate(observer.last_session)],
                  ].map(([label, value]) => (
                    <Box key={label as string} p={3} bg="ink.50" borderRadius="10px">
                      <Text fontSize="16px" fontWeight={700}>
                        {value}
                      </Text>
                      <Text fontSize="12px" color="ink.500">
                        {label}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        </DrawerBody>
        <DrawerFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} isLoading={isSaving}>
            {t('common.save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ObserversPage;
