import React from 'react';
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui';
import Icon from '@/components/Base/Icon';
import { useUserContext } from '@/contexts/UserContext';
import EditUser from './EditUser';
import Users from './Users';
import Logs from './Logs';
import Regions from './Regions';

// Account of the user and, for the administrators, the users, the regions and the journal
const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const tabs = [
    { label: t('settings.tabs.user.title'), icon: 'user-circle', panel: <EditUser /> },
    ...(user?.role === 'admin'
      ? [
          { label: t('settings.tabs.users.title'), icon: 'users-alt', panel: <Users /> },
          { label: t('settings.tabs.region.title'), icon: 'map', panel: <Regions /> },
          { label: t('settings.tabs.logs.table.title'), icon: 'receipt-alt', panel: <Logs /> },
        ]
      : []),
  ];

  return (
    <Box>
      <PageHeader eyebrow={t('menu.administration')} title={t('menu.settings')} subtitle={t('settings-page.subtitle')} />
      <Tabs variant="soft-rounded" isLazy>
        <TabList overflowX="auto" pb={2} gap={1}>
          {tabs.map((tab) => (
            <Tab key={tab.label} fontSize="14px" whiteSpace="nowrap" gap={2} color="ink.700" _selected={{ bg: 'brand.500', color: 'white' }}>
              <Icon name={tab.icon} size={18} color="currentColor" />
              {tab.label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map((tab) => (
            <TabPanel key={tab.label} px={0}>
              {tab.panel}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SettingsPage;
