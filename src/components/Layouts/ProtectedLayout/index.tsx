import React, { useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '@/contexts/UserContext';
import { CoachLogo } from '@/assets/images/logos';
import Icon from '@/components/Base/Icon';
import { confirm } from '@/common/alert';
import { TopProgress } from '@/components/ui';
import { MENU, MenuEntry } from './menu';

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

const isActive = (pathname: string, route: string) =>
  route === '/admin' ? pathname === '/admin' || pathname === '/admin/' : pathname.startsWith(route);

const NavLink: React.FC<{ item: MenuEntry; onNavigate: () => void }> = ({ item, onNavigate }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = isActive(pathname, item.route);
  return (
    <HStack
      as="a"
      href={item.route}
      onClick={(event: React.MouseEvent) => {
        event.preventDefault();
        navigate(item.route);
        onNavigate();
      }}
      aria-current={active ? 'page' : undefined}
      spacing={3}
      px={3}
      py={2.5}
      borderRadius="10px"
      bg={active ? 'brand.500' : 'transparent'}
      color={active ? 'white' : 'ink.700'}
      fontWeight={active ? 700 : 500}
      fontSize="14px"
      transition="background 120ms, color 120ms"
      _hover={{ bg: active ? 'brand.500' : 'ink.100', color: active ? 'white' : 'ink.900' }}
      _focusVisible={{ outline: 'none', boxShadow: '0 0 0 3px #C2E0FF' }}
    >
      <Icon name={item.icon} size={20} color={active ? '#FFFFFF' : '#576375'} />
      <Text as="span" flex={1}>
        {t(item.label)}
      </Text>
    </HStack>
  );
};

const SidebarContent: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const sections = useMemo(
    () =>
      MENU.map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.role || item.role === user?.role),
      })).filter((section) => section.items.length > 0),
    [user],
  );

  return (
    <Flex direction="column" h="full">
      <HStack px={5} pt={6} pb={5} spacing={3}>
        <Image src={CoachLogo} alt="" w="40px" h="40px" />
        <Box>
          <Text fontSize="16px" fontWeight={800} color="ink.900" lineHeight={1.1}>
            Coach Digital
          </Text>
          <Text fontSize="12px" fontWeight={600} color="brand.500">
            {t('app.subtitle')}
          </Text>
        </Box>
      </HStack>
      <VStack as="nav" aria-label={t('app.menu') || ''} align="stretch" spacing={5} px={3} pb={6} flex={1} overflowY="auto">
        {sections.map((section) => (
          <Box key={section.label}>
            <Text px={3} mb={1.5} fontSize="11px" fontWeight={700} letterSpacing="0.08em" color="ink.400" textTransform="uppercase">
              {t(section.label)}
            </Text>
            <VStack align="stretch" spacing={0.5}>
              {section.items.map((item) => (
                <NavLink key={item.route} item={item} onNavigate={onNavigate} />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Flex>
  );
};

export const ProtectedLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateLocalUser } = useUserContext();
  const navigate = useNavigate();
  const drawer = useDisclosure();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    if (user) updateLocalUser({ ...user, language });
  };

  const handleLogout = async () => {
    if (await confirm({ title: t('app.logout-title'), text: t('app.logout-text') || '', confirmText: t('Navbar.logout') || '' }))
      logout();
  };

  return (
    <Flex minH="100vh" bg="ink.50">
      <TopProgress />
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        w="264px"
        flex="none"
        position="sticky"
        top={0}
        h="100vh"
        bg="white"
        borderRight="1px solid"
        borderColor="ink.200"
      >
        <SidebarContent onNavigate={() => undefined} />
      </Box>

      <Drawer isOpen={drawer.isOpen} onClose={drawer.onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent maxW="280px">
          <DrawerBody p={0}>
            <SidebarContent onNavigate={drawer.onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Flex direction="column" flex={1} minW={0}>
        <HStack
          as="header"
          position="sticky"
          top={0}
          zIndex={10}
          h="64px"
          px={{ base: 4, md: 8 }}
          bg="rgba(247, 248, 250, 0.85)"
          backdropFilter="saturate(180%) blur(8px)"
          borderBottom="1px solid"
          borderColor="ink.200"
          spacing={3}
        >
          <IconButton
            display={{ base: 'inline-flex', lg: 'none' }}
            variant="ghost"
            aria-label={t('app.open-menu')}
            icon={<Icon name="bars" size={22} color="#3A4250" />}
            onClick={drawer.onOpen}
          />
          <Box flex={1} />
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              leftIcon={<Icon name="globe" size={18} color="#576375" />}
              rightIcon={<Icon name="angle-down" size={16} color="#576375" />}
              color="ink.700"
              fontWeight={600}
            >
              {i18n.language.toUpperCase()}
            </MenuButton>
            <MenuList minW="160px">
              {LANGUAGES.map((language) => (
                <MenuItem
                  key={language.value}
                  onClick={() => changeLanguage(language.value)}
                  fontWeight={i18n.language === language.value ? 700 : 400}
                >
                  {language.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu placement="bottom-end">
            <MenuButton aria-label={t('app.account') || ''}>
              <HStack spacing={2.5} pl={2} pr={1} py={1} borderRadius="full" _hover={{ bg: 'ink.100' }}>
                <Avatar size="sm" name={user?.name} bg="brand.100" color="brand.700" fontWeight={700} />
                <Box textAlign="left" display={{ base: 'none', md: 'block' }}>
                  <Text fontSize="14px" fontWeight={700} color="ink.900" lineHeight={1.2}>
                    {user?.name}
                  </Text>
                  <Text fontSize="12px" color="ink.500" lineHeight={1.2}>
                    {t(`app.roles.${user?.role}`)}
                    {user?.region?.name ? ` · ${user.region.name}` : ''}
                  </Text>
                </Box>
                <Icon name="angle-down" size={16} color="#576375" />
              </HStack>
            </MenuButton>
            <MenuList>
              <Box px={3} py={2}>
                <Text fontSize="13px" color="ink.500">
                  {user?.email}
                </Text>
              </Box>
              <MenuDivider />
              <MenuItem icon={<Icon name="setting" size={18} color="#3A4250" />} onClick={() => navigate('/admin/settings')}>
                {t('Navbar.settings')}
              </MenuItem>
              <MenuItem icon={<Icon name="signout" size={18} color="#E81C0D" />} color="#9B1208" onClick={handleLogout}>
                {t('Navbar.logout')}
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        <Box as="main" flex={1} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }} w="full" maxW="1440px" mx="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};
