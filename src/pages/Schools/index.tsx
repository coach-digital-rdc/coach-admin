import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import SchoolService from '@/services/school';
import { ISchool } from '@/types';
import { alertError, confirm, toast } from '@/common/alert';
import { downloadWorkbook } from '@/common/xlsx';
import { formatRegionPath } from '@/common/helper';
import { useUserContext } from '@/contexts/UserContext';
import SchoolForm from './SchoolForm';
import SchoolImportModal from './SchoolImportModal';
import QRCodeModal from './SchoolList/QRCodeModal';

// Schools of the DRC, by Province, PROVED and Sous-PROVED (B08); the QR code prepares a device
// for the school
const SchoolsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [schools, setSchools] = useState<ISchool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<ISchool>();
  const [isCreating, setIsCreating] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [qrSchool, setQrSchool] = useState<ISchool>();
  const [qrKey, setQrKey] = useState<string>();
  const isAdmin = user?.role === 'admin';

  const load = () => {
    setIsLoading(true);
    SchoolService.getSchools()
      .then(setSchools)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (qrSchool?.id) SchoolService.generateQrCode(qrSchool.id).then(setQrKey).catch(alertError);
  }, [qrSchool]);

  const save = async (school: Partial<ISchool>) => {
    try {
      if (editing) await SchoolService.updateSchool({ ...editing, ...school });
      else await SchoolService.saveSchool(school);
      toast.success(t('schools.saved'));
      setEditing(undefined);
      setIsCreating(false);
      load();
    } catch (error) {
      alertError(error);
    }
  };

  const remove = async (school: ISchool) => {
    const confirmed = await confirm({
      title: t('schools.delete-title', { name: school.name }),
      text: t('school.delete-detail'),
      confirmText: t('common.delete'),
      danger: true,
      onConfirm: () => SchoolService.DeleteSchool(school.id || ''),
    });
    if (confirmed) {
      toast.success(t('schools.deleted'));
      load();
    }
  };

  const columns: DataColumn<ISchool>[] = [
    {
      key: 'name',
      header: t('school.table.name'),
      render: (school) => (
        <Text fontWeight={600} color="ink.900">
          {school.name}
        </Text>
      ),
      sortValue: (school) => school.name,
    },
    { key: 'emis', header: t('school.table.emis_number'), render: (school) => school.emis_number || '—', sortValue: (school) => school.emis_number },
    {
      key: 'region',
      header: t('school.table.region'),
      render: (school) => (
        <Text fontSize="13px" color="ink.600">
          {formatRegionPath(school.region)}
        </Text>
      ),
      sortValue: (school) => formatRegionPath(school.region),
      hideBelow: 'md',
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (school) => (
        <Menu placement="bottom-end">
          <MenuButton as={IconButton} size="sm" variant="ghost" aria-label={t('common.actions')} icon={<Icon name="ellipsis-v" size={18} color="#576375" />} />
          <MenuList>
            <MenuItem icon={<Icon name="qrcode-scan" size={18} color="#3A4250" />} onClick={() => setQrSchool(school)}>
              {t('common.generateQRCode')}
            </MenuItem>
            {isAdmin && (
              <MenuItem icon={<Icon name="edit" size={18} color="#3A4250" />} onClick={() => setEditing(school)}>
                {t('common.edit')}
              </MenuItem>
            )}
            {isAdmin && (
              <MenuItem icon={<Icon name="trash-alt" size={18} color="#E81C0D" />} color="#9B1208" onClick={() => remove(school)}>
                {t('common.delete')}
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        eyebrow={t('menu.people')}
        title={t('schools.title')}
        subtitle={t('schools.subtitle')}
        actions={
          <HStack spacing={2} flexWrap="wrap">
            <Button
              variant="outline"
              leftIcon={<Icon name="download-alt" size={18} color="#3373CC" />}
              isDisabled={!schools.length}
              onClick={() =>
                downloadWorkbook(t('schools.file-name'), [
                  {
                    name: t('schools.title'),
                    rows: schools.map((school) => ({
                      [t('school.table.name')]: school.name,
                      [t('school.table.emis_number')]: school.emis_number || '',
                      [t('school.table.region')]: formatRegionPath(school.region),
                    })),
                  },
                ])
              }
            >
              {t('ui.export-xlsx')}
            </Button>
            {isAdmin && (
              <Button variant="outline" leftIcon={<Icon name="upload" size={18} color="#3373CC" />} onClick={() => setShowImport(true)}>
                {t('schools.import')}
              </Button>
            )}
            {isAdmin && (
              <Button leftIcon={<Icon name="plus" size={18} color="#FFFFFF" />} onClick={() => setIsCreating(true)}>
                {t('school.new-school')}
              </Button>
            )}
          </HStack>
        }
      />
      <DataTable
        data={schools}
        columns={columns}
        isLoading={isLoading}
        rowKey={(school) => school.id || school.name}
        searchText={(school) => `${school.name} ${school.emis_number} ${formatRegionPath(school.region)}`}
        searchPlaceholder={t('schools.search')}
        initialSort={{ key: 'name', direction: 'asc' }}
        emptyIcon="university"
      />
      <SchoolForm
        onClose={() => {
          setEditing(undefined);
          setIsCreating(false);
        }}
        onSubmit={save}
        schoolId={editing?.id}
        isOpen={!!editing || isCreating}
      />
      <SchoolImportModal
        isOpen={showImport}
        onClose={(reload) => {
          setShowImport(false);
          if (reload) load();
        }}
      />
      <QRCodeModal
        school={qrSchool}
        schoolKey={qrKey}
        handleClose={() => {
          setQrSchool(undefined);
          setQrKey(undefined);
        }}
      />
    </Box>
  );
};

export default SchoolsPage;
