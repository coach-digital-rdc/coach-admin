import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  PinInput,
  PinInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { CoachLogo } from '@/assets/images/logos';
import { useUserContext } from '@/contexts/UserContext';
import Icon from '@/components/Base/Icon';
import { TopProgress } from '@/components/ui';

const CODE_LENGTH = 8;

// Login by a code sent by e-mail (no password)
const Login: React.FC = () => {
  const { t } = useTranslation();
  const { sendOTPCode, login } = useUserContext();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (step === 'email' && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('Login.invalid-email'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (step === 'email') {
        await sendOTPCode(email.trim().toLowerCase());
        setStep('code');
      } else {
        await login({ email: email.trim().toLowerCase(), code });
      }
    } catch (err) {
      const response = (err as AxiosError<any>).response;
      setError(
        response?.status === 400 && response.data?.error
          ? response.data.error
          : t(step === 'code' ? 'Login.invalid-code' : 'Login.invalid-email'),
      );
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex minH="100vh" bg="ink.50">
      <TopProgress />
      <Flex
        display={{ base: 'none', lg: 'flex' }}
        flex={1}
        direction="column"
        justify="space-between"
        p={12}
        color="white"
        bgGradient="linear(135deg, brand.700 0%, brand.500 60%, brand.400 100%)"
        position="relative"
        overflow="hidden"
      >
        <HStack spacing={3}>
          <Image src={CoachLogo} alt="" w="44px" h="44px" borderRadius="12px" />
          <Text fontWeight={800} fontSize="18px">
            Coach Digital RDC
          </Text>
        </HStack>
        <Box maxW="480px">
          <Text fontSize="34px" fontWeight={800} lineHeight={1.15}>
            {t('login.headline')}
          </Text>
          <Text mt={4} fontSize="16px" opacity={0.9}>
            {t('login.description')}
          </Text>
        </Box>
        <Text fontSize="13px" opacity={0.75}>
          {t('login.footer')}
        </Text>
        <Box position="absolute" right="-120px" bottom="-120px" w="420px" h="420px" borderRadius="50%" bg="whiteAlpha.100" />
        <Box position="absolute" right="80px" top="-80px" w="220px" h="220px" borderRadius="50%" bg="whiteAlpha.100" />
      </Flex>

      <Flex flex={{ base: 1, lg: '0 0 520px' }} align="center" justify="center" p={{ base: 6, md: 12 }}>
        <Box as="form" onSubmit={submit} w="full" maxW="400px" noValidate>
          <Image src={CoachLogo} alt="" w="56px" h="56px" mb={6} display={{ lg: 'none' }} />
          <Text as="h1" fontSize="26px" fontWeight={800} color="ink.900">
            {t('login.title')}
          </Text>
          <Text mt={2} mb={8} color="ink.600" fontSize="15px">
            {step === 'email' ? t('login.email-intro') : t('login.code-intro', { email })}
          </Text>

          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!error && step === 'email'}>
              <FormLabel fontSize="14px" fontWeight={600}>
                {t('Login.email')}
              </FormLabel>
              <Input
                type="email"
                size="lg"
                autoComplete="email"
                autoFocus
                value={email}
                isDisabled={step === 'code'}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nom@exemple.cd"
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>

            {step === 'code' && (
              <FormControl isInvalid={!!error}>
                <FormLabel fontSize="14px" fontWeight={600}>
                  {t('Login.code-label')}
                </FormLabel>
                <HStack spacing={{ base: 1, sm: 2 }}>
                  <PinInput otp autoFocus value={code} onChange={setCode} size="lg" type="number" isDisabled={isSubmitting}>
                    {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                      <PinInputField key={index} borderRadius="10px" bg="white" />
                    ))}
                  </PinInput>
                </HStack>
                <FormErrorMessage>{error}</FormErrorMessage>
              </FormControl>
            )}

            <Button type="submit" size="lg" isLoading={isSubmitting} isDisabled={step === 'code' && code.length < CODE_LENGTH}>
              {step === 'email' ? t('Login.request-button') : t('Login.verify-button')}
            </Button>

            {step === 'code' && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon name="arrow-left" size={16} color="#3373CC" />}
                color="brand.600"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
              >
                {t('login.change-email')}
              </Button>
            )}
          </VStack>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Login;
