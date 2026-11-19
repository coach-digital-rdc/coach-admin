import React, { useEffect, useState } from 'react';
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
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader, StatusBadge } from '@/components/ui';
import { RegionFilter } from '@/components/Filters';
import Icon from '@/components/Base/Icon';
import TeacherService from '@/services/teacher';
import { RdcSchool, RdcTeacher } from '@/types/rdc';
import { alertError, toast } from '@/common/alert';
import { downloadWorkbook } from '@/common/xlsx';
import { formatDate, fullName } from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';
import _axios from '@/services';

type Teacher = RdcTeacher & { school?: RdcSchool; sessions_count?: number; last_session?: string | null };

// Teachers registered by the observers on their devices; their identity can be corrected here
const TeachersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [regionId, setRegionId] = useState<string | undefined>(user?.region_id);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Teacher>();

  const load = () => {
    setIsLoading(true);
    _axios
      .get<Teacher[]>('teacher', { params: { regionId } })
      .then((response) => setTeachers(response.data))
      .catch(alertError)
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [regionId]);

  const columns: DataColumn<Teacher>[] = [
    {
      key: 'name',
      header: t('teachers.name'),
      render: (teacher) => (
        <Text fontWeight={600} color="ink.900">
          {fullName(teacher)}
        </Text>
      ),
      sortValue: (teacher) => fullName(teacher),
    },
    { key: 'sex', header: t('observers.sex'), render: (teacher) => teacher.sex || '—', sortValue: (teacher) => teacher.sex, hideBelow: 'md' },
    { key: 'subject', header: t('sessions.subject'), render: (teacher) => teacher.subject || '—', sortValue: (teacher) => teacher.subject },
    {
      key: 'school',
      header: t('sessions.school'),
      render: (teacher) => (
        <Box>
          <Text>{teacher.school?.name || '—'}</Text>
          <Text fontSize="12px" color="ink.500">
            {teacher.school?.region?.name}
          </Text>
        </Box>
      ),
      sortValue: (teacher) => teacher.school?.name,
    },
    {
      key: 'load',
      header: t('teachers.weekly-load'),
      render: (teacher) => (teacher.weekly_load ? `${teacher.weekly_load} h` : '—'),
      sortValue: (teacher) => teacher.weekly_load ?? null,
      align: 'right',
      hideBelow: 'lg',
    },
    {
      key: 'sessions',
      header: t('teachers.observations'),
      render: (teacher) =>
        teacher.sessions_count ? <StatusBadge tone="brand">{teacher.sessions_count}</StatusBadge> : <StatusBadge tone="yellow">0</StatusBadge>,
      sortValue: (teacher) => teacher.sessions_count || 0,
      align: 'right',
    },
    {
      key: 'last',
      header: t('observers.last-session'),
      render: (teacher) => formatDate(teacher.last_session),
      sortValue: (teacher) => teacher.last_session || '',
      hideBelow: 'lg',
    },
    { key: 'edit', header: '', width: '40px', render: () => <Icon name="angle-right" size={20} color="#9AA2AC" /> },
  ];

  const exportList = () =>
    downloadWorkbook(t('teachers.file-name'), [
      {
        name: t('teachers.title'),
        rows: teachers.map((teacher) => ({
          [t('observers.surname')]: teacher.surname || '',
          [t('observers.first-name')]: teacher.name,
          [t('observers.sex')]: teacher.sex || '',
          [t('sessions.subject')]: teacher.subject || '',
          [t('teachers.weekly-load')]: teacher.weekly_load ?? '',
          [t('sessions.school')]: teacher.school?.name || '',
          [t('sessions.region')]: teacher.school?.region?.name || '',
          [t('teachers.observations')]: teacher.sessions_count || 0,
          [t('observers.last-session')]: formatDate(teacher.last_session),
        })),
      },
    ]);

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.people')}
        title={t('teachers.title')}
        subtitle={t('teachers.subtitle')}
        actions={
          <Button variant="outline" leftIcon={<Icon name="download-alt" size={18} color="#3373CC" />} onClick={exportList} isDisabled={!teachers.length}>
            {t('ui.export-xlsx')}
          </Button>
        }
      />
      <DataTable
        data={teachers}
        columns={columns}
        isLoading={isLoading}
        rowKey={(teacher) => teacher.id}
        onRowClick={setEditing}
        searchText={(teacher) => `${fullName(teacher)} ${teacher.subject} ${teacher.school?.name}`}
        searchPlaceholder={t('teachers.search')}
        initialSort={{ key: 'name', direction: 'asc' }}
        emptyIcon="graduation-cap"
        emptyTitle={t('teachers.empty')}
        emptyDescription={t('teachers.empty-description')}
        toolbar={<RegionFilter onChange={setRegionId} />}
      />
      <TeacherDrawer
        teacher={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          load();
        }}
      />
    </Box>
  );
};

const TeacherDrawer: React.FC<{ teacher?: Teacher; onClose: () => void; onSaved: () => void }> = ({ teacher, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', surname: '', sex: '', subject: '', weekly_load: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: teacher?.name || '',
      surname: teacher?.surname || '',
      sex: teacher?.sex || '',
      subject: teacher?.subject || '',
      weekly_load: teacher?.weekly_load ? String(teacher.weekly_load) : '',
    });
  }, [teacher]);

  const save = async () => {
    if (!teacher) return;
    setIsSaving(true);
    try {
      await TeacherService.updateTeacher({
        id: teacher.id,
        name: form.name.trim(),
        surname: form.surname.trim(),
        sex: form.sex || null,
        subject: form.subject.trim(),
        weekly_load: form.weekly_load ? Number(form.weekly_load) : null,
        updated_at: new Date(),
      } as any);
      toast.success(t('teachers.saved'));
      onSaved();
    } catch (error) {
      alertError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={!!teacher} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton mt={2} />
        <DrawerHeader>{fullName(teacher)}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={5} align="stretch">
            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="14px">{t('observers.first-name')}</FormLabel>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="14px">{t('observers.surname')}</FormLabel>
                <Input value={form.surname} onChange={(event) => setForm({ ...form, surname: event.target.value })} />
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="14px">{t('observers.sex')}</FormLabel>
                <Select value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}>
                  <option value="">—</option>
                  <option value="F">{t('observers.sexes.F')}</option>
                  <option value="M">{t('observers.sexes.M')}</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="14px">{t('teachers.weekly-load')}</FormLabel>
                <NumberInput min={0} max={60} value={form.weekly_load} onChange={(value) => setForm({ ...form, weekly_load: value })}>
                  <NumberInputField borderRadius="10px" />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel fontSize="14px">{t('sessions.subject')}</FormLabel>
              <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </FormControl>
            <Box p={4} bg="ink.50" borderRadius="12px">
              <Text fontSize="13px" color="ink.500">
                {t('sessions.school')}
              </Text>
              <Text fontWeight={600}>{teacher?.school?.name || '—'}</Text>
              <Text fontSize="13px" color="ink.500" mt={2}>
                {t('teachers.observations-summary', {
                  count: teacher?.sessions_count || 0,
                  date: formatDate(teacher?.last_session),
                })}
              </Text>
            </Box>
            <Text fontSize="13px" color="ink.500">
              {t('grid.sync-note')}
            </Text>
          </VStack>
        </DrawerBody>
        <DrawerFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} isLoading={isSaving} isDisabled={!form.name.trim()}>
            {t('common.save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TeachersPage;
