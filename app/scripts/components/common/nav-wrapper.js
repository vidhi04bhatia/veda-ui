import React from 'react';
import T from 'prop-types';
import styled, { css } from 'styled-components';

import PageHeader from './page-header';
import { useSlidingStickyHeaderProps } from './layout-root';
import PageLocalNav from '$components/common/page-local-nav';

import { HEADER_WRAPPER_ID } from '$utils/use-sliding-sticky-header';

const NavWrapper = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 10000;

  transition: top 0.32s ease-out;
  ${({ shouldSlideHeader, headerHeight }) =>
    // Hide the header by translating the nav by the header's height. The
    // translate is in the NavWrapper and not the header because in this way the
    // localNav (also inside the NavWrapper) will stick to the top.
    shouldSlideHeader &&
    css`
      top: -${headerHeight}px;
    `}
`;

function PageNavWrapper({ localNavProps }) {
  const renderLocalNav = !!localNavProps;

  const { isHeaderHidden, headerHeight } = useSlidingStickyHeaderProps();

  return (
    <NavWrapper
      id={HEADER_WRAPPER_ID}
      shouldSlideHeader={isHeaderHidden}
      headerHeight={headerHeight}
    >
      <PageHeader />
      {renderLocalNav && <PageLocalNav {...localNavProps} />}
    </NavWrapper>
  );
}

PageNavWrapper.propTypes = {
  localNavProps: T.object
};

export default PageNavWrapper;
