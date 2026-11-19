import { extendTheme } from '@chakra-ui/react';

// Colours and font of the mobile application, so that both keep the same identity
export const lightTheme = extendTheme({
  colors: {
    brand: {
      50: '#EBF5FF',
      100: '#C2E0FF',
      200: '#99CBFF',
      300: '#5C9DE6',
      400: '#4486D9',
      500: '#3373CC',
      600: '#0052A3',
      700: '#003F7D',
      800: '#0B2D57',
      900: '#071D3A',
    },
    ink: {
      50: '#F7F8FA',
      100: '#F2F4F7',
      200: '#DCE0E5',
      300: '#C7CBD1',
      400: '#9AA2AC',
      500: '#7D8693',
      600: '#576375',
      700: '#3A4250',
      800: '#1F242C',
      900: '#111417',
    },
    // Tokens of the first version of the administration, still used by some forms
    Primary: { $100: '#EBF1FF', $200: '#3373CC', $300: '#264673' },
    Secondary: { $100: '#D9F2F2', $200: '#66CCCC' },
    Gray: {
      $100: '#FFFFFF',
      $200: '#F9FAFB',
      $300: '#F0F2F4',
      $400: '#E3E6E9',
      $500: '#C4CBD4',
      $600: '#8F97A3',
      $700: '#576375',
      $800: '#16191D',
    },
  },

  fonts: {
    body: `'Noto Sans', system-ui, sans-serif`,
    heading: `'Noto Sans', system-ui, sans-serif`,
    mono: `ui-monospace, Menlo, monospace`,
  },

  fontSizes: {
    H_lg: '32px',
    H_md: '28px',
    H_sm: '24px',
    H_xs: '20px',
    L_lg: '18px',
    L_md: '16px',
    L_sm: '14px',
    L_xs: '12px',
  },

  radii: { card: '16px' },

  shadows: {
    card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
    raised: '0 12px 24px -6px rgba(16, 24, 40, 0.12), 0 4px 8px -4px rgba(16, 24, 40, 0.06)',
  },

  styles: {
    global: {
      body: { bg: 'ink.50', color: 'ink.900' },
      '::selection': { bg: 'brand.100' },
    },
  },

  components: {
    Button: {
      baseStyle: { fontWeight: 600, borderRadius: '10px' },
      defaultProps: { colorScheme: 'brand' },
    },
    Input: {
      defaultProps: { focusBorderColor: 'brand.500' },
      variants: { outline: { field: { bg: 'white', borderRadius: '10px', borderColor: 'ink.200' } } },
    },
    Select: {
      defaultProps: { focusBorderColor: 'brand.500' },
      variants: { outline: { field: { bg: 'white', borderRadius: '10px', borderColor: 'ink.200' } } },
    },
    Textarea: {
      defaultProps: { focusBorderColor: 'brand.500' },
      variants: { outline: { bg: 'white', borderRadius: '10px', borderColor: 'ink.200' } },
    },
    Tabs: { defaultProps: { colorScheme: 'brand' } },
    Switch: { defaultProps: { colorScheme: 'brand' } },
    Checkbox: { defaultProps: { colorScheme: 'brand' } },
    Radio: { defaultProps: { colorScheme: 'brand' } },
    Progress: { defaultProps: { colorScheme: 'brand' } },
    Spinner: { defaultProps: { color: 'brand.500' } },
    Badge: { baseStyle: { borderRadius: '999px', px: 2, py: 0.5, textTransform: 'none', fontWeight: 600 } },
    Drawer: { sizes: { md: { dialog: { maxW: '480px' } } } },
    Modal: { baseStyle: { dialog: { borderRadius: '16px' } } },
    Menu: { baseStyle: { list: { borderRadius: '12px', boxShadow: 'raised', py: 2 } } },
  },
});
