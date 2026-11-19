import { Card, PageLoader } from '@/components/ui';
import { UserContext } from '@/contexts/UserContext';
import { IUser } from '@/types';
import { Avatar, Box, Button, FormControl, FormErrorMessage, FormLabel, HStack, Input, Text } from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const EditUser = () => {
  const { t } = useTranslation();
  const { user, handleUpdateUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleSubmitForm = async (user: Partial<IUser>) => {
    setIsLoading(true);
    await handleUpdateUser(user);
    setIsLoading(false);
  };

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <Card p={6} maxW="520px" w="full">
          <HStack spacing={4} mb={6}>
            <Avatar size="lg" name={user?.name} bg="brand.100" color="brand.700" fontWeight={700} />
            <Box>
              <Text fontWeight={700} fontSize={'18px'}>
                {t('settings.tabs.user.title')}
              </Text>
              <Text fontSize="14px" color={'ink.600'}>
                {t('settings.tabs.user.description')}
              </Text>
            </Box>
          </HStack>

          <form
            onSubmit={handleSubmit(handleSubmitForm)}
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <FormControl isInvalid={!!errors.name}>
              <FormLabel htmlFor="name">{t('settings.tabs.user.name')}</FormLabel>
              <Input id="name" defaultValue={user?.name} {...register('name', { required: true })} />
              <FormErrorMessage>
                {errors.name && errors.name.type === 'required' && t('observers.required')}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email} style={{ marginTop: '16px' }}>
              <FormLabel htmlFor="name">{t('settings.tabs.user.email')}</FormLabel>
              <Input id="name" defaultValue={user?.email} {...register('email', { required: true })} />
              <FormErrorMessage>
                {errors.email && errors.email.type === 'required' && t('observers.required')}
              </FormErrorMessage>
            </FormControl>

            <Button type="submit" mt={'28px'} alignSelf="flex-start">
              {t('settings.tabs.user.save')}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
};

export default EditUser;
