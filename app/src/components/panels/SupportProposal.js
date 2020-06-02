import React, { useCallback, useMemo, useState } from 'react'
import BN from 'bn.js'
import { useAragonApi } from '@aragon/api-react'
import {
  Button,
  ButtonBase,
  Field,
  GU,
  Info,
  TextInput,
  useSidePanelFocusOnReady,
  useTheme,
} from '@aragon/ui'
import { toDecimals, round } from '../../lib/math-utils'
import useAccountTotalStaked from '../../hooks/useAccountTotalStaked'
import { formatTokenAmount } from '../../lib/token-utils'

const SupportProposal = React.memo(function SupportProposal({ id, onDone }) {
  const theme = useTheme()
  const [amount, setAmount] = useState({
    value: '0',
    valueBN: new BN(0),
  })

  const {
    api,
    appState: { stakeToken },
  } = useAragonApi()
  const inputRef = useSidePanelFocusOnReady()

  const totalStaked = useAccountTotalStaked()
  const nonStakedTokens = stakeToken.balanceBN.sub(totalStaked)

  const handleEditMode = useCallback(
    editMode => {
      setAmount(amount => ({
        ...amount,
        value: amount.valueBN.gte(0)
          ? formatTokenAmount(
              amount.valueBN,
              stakeToken.tokenDecimals,
              false,
              false,
              {
                commas: !editMode,
                replaceZeroBy: editMode ? '' : '0',
                rounding: stakeToken.tokenDecimals,
              }
            )
          : '',
      }))
    },
    [stakeToken]
  )

  // Amount change handler
  const handleAmountChange = useCallback(
    event => {
      const newAmount = event.target.value

      const newAmountInt = parseInt(newAmount || '0')
      const newAmountBN = new BN(
        isNaN(newAmountInt)
          ? -1
          : toDecimals(String(newAmountInt), stakeToken.tokenDecimals)
      )

      setAmount({
        value: newAmount,
        valueBN: newAmountBN,
      })
    },
    [stakeToken]
  )

  const handleMaxSelected = useCallback(() => {
    setAmount({
      valueBN: nonStakedTokens,
      value: formatTokenAmount(
        nonStakedTokens,
        stakeToken.tokenDecimals,
        false,
        false,
        { commas: false, rounding: stakeToken.tokenDecimals }
      ),
    })
  }, [nonStakedTokens, stakeToken])

  // Form submit handler
  const handleSubmit = useCallback(
    event => {
      event.preventDefault()

      api.stakeToProposal(id, String(amount.valueBN)).toPromise()

      onDone()
    },
    [amount, api, onDone, stakeToken]
  )

  const errorMessage = useMemo(() => {
    if (amount.valueBN.eq(new BN(-1))) {
      return 'Invalid amount'
    }

    if (amount.valueBN.gt(nonStakedTokens)) {
      return 'Insufficient balance'
    }

    return null
  }, [amount])

  // Calculate percentages
  const nonStakedPct = round((nonStakedTokens * 100) / stakeToken.balance)
  const stakedPct = 100 - nonStakedPct

  return (
    <form onSubmit={handleSubmit}>
      <Info
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        This action will create a proposal which can be voted on by staking
        {stakeToken.symbol}. The action will be executable if the accrued total
        stake reaches above the threshold.
      </Info>
      <Field
        label="amount"
        css={`
          margin-top: ${2 * GU}px;
        `}
      >
        <TextInput
          value={amount.value}
          onChange={handleAmountChange}
          onFocus={() => handleEditMode(true)}
          onBlur={() => handleEditMode(false)}
          wide
          ref={inputRef}
          adornment={
            <ButtonBase
              css={`
                margin-right: ${1 * GU}px;
                color: ${theme.accent};
              `}
              onClick={handleMaxSelected}
            >
              MAX
            </ButtonBase>
          }
          adornmentPosition="end"
        />
      </Field>
      <Button
        label="Support this proposal"
        wide
        type="submit"
        mode="strong"
        disabled={amount.valueBN.eq(new BN(0)) || Boolean(errorMessage)}
      />
      {errorMessage && (
        <Info
          css={`
            margin-top: ${2 * GU}px;
          `}
          mode="warning"
        >
          {errorMessage}
        </Info>
      )}
      <Info
        css={`
          margin-top: ${2 * GU}px;
        `}
      >
        You have{' '}
        <strong>
          {formatTokenAmount(nonStakedTokens, stakeToken.tokenDecimals)}{' '}
          {stakeToken.tokenSymbol}
        </strong>{' '}
        ({nonStakedPct}% of your balance) available to support this proposal.
        You are supporting other proposals with{' '}
        <strong>
          {formatTokenAmount(totalStaked, stakeToken.tokenDecimals)} locked
          tokens
        </strong>{' '}
        ({stakedPct}% of your balance).
      </Info>
    </form>
  )
})

export default SupportProposal
