import React from 'react'
import styled, { CSSProperties } from 'styled-components'

import { Button } from 'components/buttons/Button'

const FooterWrapper = styled.div`
  display: grid;
  place-items: center;
  padding: 15px 18px;
`
const ButtonStyle: CSSProperties = {
  width: '100%',
  fontFamily: 'Averta, sans-serif',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '18px',
  lineHeight: '22px',
}

interface Props {
  title?: string
}
export const LandingTableFooter: React.FC<Props> = (props) => {
  const { title = 'View All Conditions' } = props
  return (
    <FooterWrapper>
      <Button style={ButtonStyle}>{title}</Button>
    </FooterWrapper>
  )
}
