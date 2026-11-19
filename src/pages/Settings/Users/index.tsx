import React, { useCallback, useEffect, useState } from 'react';
import { Avatar, Box, Button, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { DataColumn, DataTable, StatusBadge } from '@/components/ui';
import { useUserContext } from '@/contexts/UserContext';
import UserService from '@/services/user';
import AuthService from '@/services/auth';
import Icon from '@/components/Base/Icon';
import { alertError, confirm, toast } from '@/common/alert';
import { formatRegionPath } from '@/common/helper';
import { IUser } from '@/types';
import UserForm from './Form';

// Users of the administration: administrators edit, analysts read; both see their region only
const Users: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [editing, setEditing] = useState<IUser>();
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    UserService.getUsers()
      .then(setUsers)
      .catch(alertError)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  const remove = async (target: IUser) => {
    const confirmed = await confirm({
      title: t('users.delete-title', { name: target.name }),
      text: t('users.delete-text'),
      confirmText: t('common.delete'),
      danger: true,
      onConfirm: () => UserService.removeUser(target.id),
    });
    if (confirmed) {
      toast.success(t('users.deleted'));
      refresh();
    }
  };

  const submit: SubmitHandler<IUser> = async (values) => {
    try {
      if ('id' in values && values.id) await UserService.updateUser(values.id, values);
      else await AuthService.sighup(values);
      toast.success(t('users.saved'));
      setEditing(undefined);
      refresh();
    } catch (error) {
      alertError(error);
    }
  };

  const columns: DataColumn<IUser>[] = [
    {
      key: 'name',
      header: t('users.name'),
      render: (item) => (
        <HStack spacing={3}>
          <Avatar size="sm" name={item.name} bg="brand.100" color="brand.700" fontWeight={700} />
          <Box>
            <Text fontWeight={600}>
              {item.name}
              {item.id === user?.id && (
                <Text as="span" ml={2} fontSize="12px" color="ink.500" fontWeight={400}>
                  {t('users.you')}
                </Text>
              )}
            </Text>
            <Text fontSize="13px" color="ink.500">
              {item.email}
            </Text>
          </Box>
        </HStack>
      ),
      sortValue: (item) => item.name,
    },
    {
      key: 'role',
      header: t('users.role'),
      render: (item) => <StatusBadge tone={item.role === 'admin' ? 'violet' : 'gray'}>{t(`app.roles.${item.role}`)}</StatusBadge>,
      sortValue: (item) => item.role,
    },
    {
      key: 'region',
      header: t('users.region'),
      render: (item) => (item.region ? formatRegionPath(item.region) : t('users.all-regions')),
      sortValue: (item) => (item.region ? formatRegionPath(item.region) : ''),
      hideBelow: 'md',
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (item) =>
        item.id !== user?.id && (
          <Menu placement="bottom-end">
            <MenuButton as={IconButton} size="sm" variant="ghost" aria-label={t('common.actions')} icon={<Icon name="ellipsis-v" size={18} color="#576375" />} />
            <MenuList>
              <MenuItem icon={<Icon name="edit" size={18} color="#3A4250" />} onClick={() => setEditing(item)}>
                {t('common.edit')}
              </MenuItem>
              <MenuItem icon={<Icon name="trash-alt" size={18} color="#E81C0D" />} color="#9B1208" onClick={() => remove(item)}>
                {t('common.delete')}
              </MenuItem>
            </MenuList>
          </Menu>
        ),
    },
  ];

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        searchText={(item) => `${item.name} ${item.email}`}
        initialSort={{ key: 'name', direction: 'asc' }}
        emptyIcon="users-alt"
        toolbar={
          <Button
            size="md"
            leftIcon={<Icon name="plus" size={18} color="#FFFFFF" />}
            onClick={() => setEditing({ name: '', email: '', role: '' } as unknown as IUser)}
          >
            {t('settings.tabs.users.new')}
          </Button>
        }
      />
      <UserForm handleClose={() => setEditing(undefined)} defaultValues={editing as IUser} handleSubmitForm={submit} />
    </>
  );
};

export default Users;
