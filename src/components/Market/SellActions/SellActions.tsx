import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Checkbox, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useWeb3React } from '@web3-react/core';

import BigNumber from 'bignumber.js';

import { CoinBridgeToken, Erc20, Erc20ABI, coinBridgeTokenABI } from 'src/abis';
import { ContractsID, NOTIFICATIONS, NotificationsID } from 'src/constants';
import { ZERO_ADDRESS } from 'src/constants';
import { useActiveChain } from 'src/hooks';
import coinBridgeTokenPermitSignature from 'src/hooks/coinBridgeTokenPermitSignature';
import { useContract } from 'src/hooks/useContract';
import { getContract } from 'src/utils';

import { NumberInput } from '../../NumberInput';

type SellFormValues = {
  offerTokenAddress: string;
  buyerTokenAddress: string;
  price: number;
  amount: number;
  buyerAddress: string;
  isPrivateOffer: boolean;
};

export const SellActions = () => {
  const { account, provider } = useWeb3React();
  const { getInputProps, onSubmit, reset, setFieldValue, values } =
    useForm<SellFormValues>({
      // eslint-disable-next-line object-shorthand
      initialValues: {
        offerTokenAddress: '',
        buyerTokenAddress: '',
        price: 50,
        amount: 1,
        buyerAddress: ZERO_ADDRESS,
        isPrivateOffer: false,
      },
    });

  // const [isPrivateOffer, setIsPrivateOffer] = useState(false);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [amountMax, setAmountMax] = useState<number>();
  const activeChain = useActiveChain();

  const { t } = useTranslation('modals', { keyPrefix: 'sell' });

  // const sellerBalance = new BigNumber(
  // 	(await offerToken.balanceOf(account)).toString()
  // ).shiftedBy(-offerTokenDecimals);

  useEffect(() => {
    setAmountMax(1);
  }, [values]);

  useEffect(() => {
    if (!amountMax) return;
    setFieldValue('amount', amountMax);
  }, [amountMax, setFieldValue]);

  const realTokenYamUpgradeable = useContract(
    ContractsID.realTokenYamUpgradeable
  );

  const onHandleSubmit = useCallback(
    async (formValues: SellFormValues) => {
      try {
        if (
          !account ||
          !provider ||
          !realTokenYamUpgradeable ||
          !formValues.offerTokenAddress ||
          !formValues.buyerTokenAddress ||
          !formValues.price ||
          !formValues.amount
        ) {
          return;
        }

        if (!provider || !account) {
          return;
        }

        setSubmitting(true);
        const offerToken = getContract<CoinBridgeToken>(
          formValues.offerTokenAddress,
          coinBridgeTokenABI,
          provider,
          account
        );
        const buyerToken = getContract<Erc20>(
          formValues.buyerTokenAddress,
          Erc20ABI,
          provider,
          account
        );

        if (!offerToken || !buyerToken) {
          console.log('offerToken or buyerToken not found');
          return;
        }
        const offerTokenDecimals = await offerToken.decimals();
        const buyerTokenDecimals = await buyerToken.decimals();

        const amountInWei = new BigNumber(
          formValues.amount.toString()
        ).shiftedBy(Number(offerTokenDecimals));
        const oldAllowance = await offerToken.allowance(
          account,
          realTokenYamUpgradeable.address
        );
        const amountInWeiToPermit = amountInWei.plus(
          new BigNumber(oldAllowance.toString())
        );

        const priceInWei = new BigNumber(formValues.price.toString()).shiftedBy(
          Number(buyerTokenDecimals)
        );

        const transactionDeadline = Date.now() + 3600; // permit valable during 1h

        const { r, s, v }: any = await coinBridgeTokenPermitSignature(
          account,
          realTokenYamUpgradeable.address,
          amountInWeiToPermit.toString(),
          transactionDeadline,
          offerToken,
          provider
        );
        console.log('values: ', values);
        console.log('form values: ', formValues);

        const tx1 = await realTokenYamUpgradeable.createOfferWithPermit(
          formValues.offerTokenAddress,
          formValues.buyerTokenAddress,
          formValues.isPrivateOffer === false
            ? ZERO_ADDRESS
            : formValues.buyerAddress,
          priceInWei.toString(),
          amountInWeiToPermit.toString(),
          transactionDeadline.toString(),
          v,
          r,
          s
        );

        const notificationPayload = {
          key: tx1.hash,
          href: `${activeChain?.blockExplorerUrl}tx/${tx1.hash}`,
          hash: tx1.hash,
        };

        showNotification(
          NOTIFICATIONS[NotificationsID.createOfferLoading](notificationPayload)
        );

        tx1
          .wait()
          .then(({ status }) =>
            updateNotification(
              NOTIFICATIONS[
                status === 1
                  ? NotificationsID.createOfferSuccess
                  : NotificationsID.createOfferError
              ](notificationPayload)
            )
          );
      } catch (error) {
        console.log('ERROR WHEN SELLING WITH PERMIT', error);
        showNotification(NOTIFICATIONS[NotificationsID.createOfferInvalid]());
      } finally {
        setSubmitting(false);
      }
    },
    [
      account,
      provider,
      realTokenYamUpgradeable,
      values,
      activeChain?.blockExplorerUrl,
    ]
  );

  return (
    <Box sx={{ maxWidth: 400 }} mx={'auto'}>
      <h3>{'Create your offer'}</h3>
      <form onSubmit={onSubmit(onHandleSubmit)}>
        <Stack justify={'center'} align={'stretch'}>
          <TextInput
            label={t('offerTokenAddress')}
            placeholder={'Put the address of the token you want to sell'}
            required={true}
            {...getInputProps('offerTokenAddress')}
          />
          <TextInput
            label={t('buyerTokenAddress')}
            placeholder={'Put the address of the token you want to buy'}
            required={true}
            {...getInputProps('buyerTokenAddress')}
          />
          <NumberInput
            label={t('price')}
            placeholder={t('price')}
            required={true}
            min={0.000001}
            max={undefined}
            step={undefined}
            showMax={false}
            sx={{ flexGrow: 1 }}
            {...getInputProps('price')}
          />
          <NumberInput
            label={t('amount')}
            placeholder={t('amount')}
            required={true}
            min={0.000001}
            max={undefined}
            step={undefined}
            showMax={false}
            sx={{ flexGrow: 1 }}
            {...getInputProps('amount')}
          />
          <TextInput
            label={'Buyer Address (only for private offers)'}
            placeholder={'Put the address of the private buyer'}
            required={values.isPrivateOffer}
            disabled={!values.isPrivateOffer}
            {...getInputProps('buyerAddress')}
          />
          <Checkbox
            mt={'md'}
            label={'I want to create a private offer'}
            {...getInputProps('isPrivateOffer', { type: 'checkbox' })}
          />
          <Group position={'left'} mt={'md'}>
            <Button type={'submit'} loading={isSubmitting}>
              {'Permit and Create Offer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};
