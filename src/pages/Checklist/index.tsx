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
  IconButton,
  Input,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, PageHeader, StatusBadge } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import RdcService from '@/services/rdc';
import { RdcChecklistItem } from '@/types/rdc';
import { alertError, toast } from '@/common/alert';
import { formatDate } from '@/common/labels';
import { useUserContext } from '@/contexts/UserContext';

// Documents of the teacher and of the learners checked during the observation (B12)
const ChecklistPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [items, setItems] = useState<RdcChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<RdcChecklistItem>();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    RdcService.getChecklist()
      .then(setItems)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, []);

  const columns: DataColumn<RdcChecklistItem>[] = [
    { key: 'code', header: t('checklist.number'), render: (item) => <Text fontWeight={700}>{item.code}</Text>, sortValue: (item) => item.code, width: '60px' },
    {
      key: 'owner',
      header: t('checklist.owner'),
      render: (item) => <StatusBadge tone={item.owner === 'TEACHER' ? 'brand' : 'violet'}>{t(`checklist.owners.${item.owner}`)}</StatusBadge>,
      sortValue: (item) => item.owner,
    },
    { key: 'document', header: t('checklist.document'), render: (item) => <Text fontWeight={600}>{item.document_name}</Text>, sortValue: (item) => item.document_name },
    {
      key: 'statement',
      header: t('checklist.statement'),
      render: (item) => (
        <Text fontSize="13px" color="ink.600" whiteSpace="normal" minW="280px">
          {item.statement}
        </Text>
      ),
      hideBelow: 'md',
    },
    {
      key: 'updated',
      header: t('checklist.updated'),
      render: (item) => <Text fontSize="13px" color="ink.500">{formatDate(item.updated_at)}</Text>,
      hideBelow: 'lg',
    },
    ...(isAdmin
      ? [
          {
            key: 'edit',
            header: '',
            width: '56px',
            render: (item: RdcChecklistItem) => (
              <IconButton
                size="sm"
                variant="ghost"
                aria-label={t('checklist.edit', { code: item.code })}
                icon={<Icon name="edit" size={18} color="#576375" />}
                onClick={() => setEditing(item)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <Box>
      <PageHeader eyebrow={t('menu.reference')} title={t('checklist.title')} subtitle={t('checklist.subtitle')} />
      <DataTable
        data={items}
        columns={columns}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        searchText={(item) => `${item.code} ${item.document_name} ${item.statement}`}
        initialSort={{ key: 'code', direction: 'asc' }}
        pageSize={20}
        emptyIcon="file-check"
      />
      <ChecklistDrawer
        item={editing}
        onClose={() => setEditing(undefined)}
        onSaved={(saved) => {
          setItems(items.map((item) => (item.id === saved.id ? saved : item)));
          setEditing(undefined);
        }}
      />
    </Box>
  );
};

const ChecklistDrawer: React.FC<{
  item?: RdcChecklistItem;
  onClose: () => void;
  onSaved: (item: RdcChecklistItem) => void;
}> = ({ item, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [documentName, setDocumentName] = useState('');
  const [statement, setStatement] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDocumentName(item?.document_name || '');
    setStatement(item?.statement || '');
  }, [item]);

  const save = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const saved = await RdcService.updateChecklistItem(item.id, {
        document_name: documentName.trim(),
        statement: statement.trim(),
      });
      toast.success(t('checklist.saved'));
      onSaved(saved);
    } catch (error) {
      alertError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={!!item} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton mt={2} />
        <DrawerHeader>{t('checklist.edit', { code: item?.code })}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('checklist.document')}
              </FormLabel>
              <Input value={documentName} onChange={(event) => setDocumentName(event.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('checklist.statement')}
              </FormLabel>
              <Textarea rows={5} value={statement} onChange={(event) => setStatement(event.target.value)} />
            </FormControl>
            <Text fontSize="13px" color="ink.500">
              {t('grid.sync-note')}
            </Text>
          </VStack>
        </DrawerBody>
        <DrawerFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} isLoading={isSaving} isDisabled={!documentName.trim() || !statement.trim()}>
            {t('common.save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ChecklistPage;
