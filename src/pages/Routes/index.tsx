import React from 'react'
import { Redirect, Route, RouteProps, Switch } from 'react-router-dom'

import { InfoCard } from 'components/statusInfo/InfoCard'
import { Web3ContextStatus, useWeb3Context } from 'contexts/Web3Context'
import { useIsStateStalled } from 'hooks/useIsStateStalled'
import { ConditionDetails } from 'pages/ConditionDetails'
import { ConditionsList } from 'pages/ConditionsList'
import { CookiePolicy } from 'pages/CookiePolicy'
import { MergePositions } from 'pages/MergePositions'
import { PositionDetails } from 'pages/PositionDetails'
import { PositionsList } from 'pages/PositionsList'
import { PrepareCondition } from 'pages/PrepareCondition'
import { PrivacyPolicy } from 'pages/PrivacyPolicy'
import { RedeemPosition } from 'pages/RedeemPosition'
import { ReportPayoutsContainer } from 'pages/ReportPayouts'
import { SplitPosition } from 'pages/SplitPosition'
import { TermsAndConditions } from 'pages/TermsAndConditions'

const ProtectedRoute: React.FC<RouteProps> = (props) => {
  const { component, path } = props
  const { status } = useWeb3Context()
  const connectingError = useIsStateStalled(status._type, Web3ContextStatus.Connecting, 2500)

  return (
    <>
      {connectingError && (
        <InfoCard message="You need to unlock or connect your wallet..." title="Error" />
      )}
      {status._type === Web3ContextStatus.Error && (
        <InfoCard message="Error when trying to connect..." title="Error" />
      )}
      {status._type === Web3ContextStatus.WrongNetwork && (
        <InfoCard
          message="The network you are trying to connect is not supported..."
          title="Error"
        />
      )}
      {(status._type === Web3ContextStatus.Connected ||
        status._type === Web3ContextStatus.Infura) && (
        <Route component={component} exact path={path} />
      )}
    </>
  )
}

export const Routes: React.FC = () => {
  return (
    <Switch>
      <ProtectedRoute component={ConditionsList} exact path="/conditions" />
      <ProtectedRoute component={ConditionDetails} exact path="/conditions/:conditionId" />
      <ProtectedRoute component={PositionsList} exact path="/positions" />
      <ProtectedRoute component={PositionDetails} exact path="/positions/:positionId" />
      <ProtectedRoute component={PrepareCondition} path="/prepare" />
      <ProtectedRoute component={SplitPosition} path="/split/:conditionId?" />
      <ProtectedRoute component={ReportPayoutsContainer} path="/report/:conditionId?" />
      <ProtectedRoute component={RedeemPosition} path="/redeem/:positionId?" />
      <ProtectedRoute component={MergePositions} path="/merge" />
      <ProtectedRoute component={TermsAndConditions} path="/terms-and-conditions" />
      <ProtectedRoute component={CookiePolicy} path="/cookie-policy" />
      <ProtectedRoute component={PrivacyPolicy} path="/privacy-policy" />
      <Route exact path="/">
        <Redirect to="/conditions" />
      </Route>
      <Route path="*">
        <InfoCard message="Page not found..." title="Error 404" />
      </Route>
    </Switch>
  )
}
