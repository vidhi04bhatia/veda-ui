import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Link, NavLink } from 'react-router-dom';
import {
  glsp,
  listReset,
  media,
  rgba,
  themeVal,
  visuallyHidden
} from '@devseed-ui/theme-provider';
import { reveal } from '@devseed-ui/animation';
import { Heading, Overline } from '@devseed-ui/typography';
import { Button } from '@devseed-ui/button';
import {
  CollecticonHamburgerMenu
} from '@devseed-ui/collecticons';
import { DropMenu, DropMenuItem } from '@devseed-ui/dropdown';

import DropdownScrollable from './dropdown-scrollable';
import NasaLogo from './nasa-logo';
import GoogleForm from './google-form';
import { Tip } from './tip';
import UnscrollableBody from './unscrollable-body';

import { variableGlsp } from '$styles/variable-utils';
import { PAGE_BODY_ID } from '$components/common/layout-root';
import GlobalMenuLinkCSS from '$styles/menu-link';
import { useMediaQuery } from '$utils/use-media-query';
import { HEADER_ID } from '$utils/use-sliding-sticky-header';
import { ComponentOverride } from '$components/common/page-overrides';

const rgbaFixed = rgba as any;

const appTitle = process.env.APP_TITLE;
const appVersion = process.env.APP_VERSION;

const PageHeaderSelf = styled.header`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: ${variableGlsp()};
  padding: ${variableGlsp(0.75, 1)};
  background: ${themeVal('color.primary')};
  animation: ${reveal} 0.32s ease 0s 1;

  &,
  &:visited {
    color: ${themeVal('color.surface')};
  }
`;

const Brand = styled.div`
  display: flex;
  flex-shrink: 0;

  a {
    display: grid;
    align-items: center;
    gap: ${glsp(0, 0.5)};

    &,
    &:visited {
      color: inherit;
      text-decoration: none;
    }

    #nasa-logo-neg-mono {
      opacity: 1;
      transition: all 0.32s ease 0s;
    }

    #nasa-logo-pos {
      opacity: 0;
      transform: translate(0, -100%);
      transition: all 0.32s ease 0s;
    }

    &:hover {
      opacity: 1;

      #nasa-logo-neg-mono {
        opacity: 0;
      }

      #nasa-logo-pos {
        opacity: 1;
      }
    }

    svg {
      grid-row: 1 / span 2;
      height: 2.5rem;
      width: auto;

      ${media.largeUp`
        transform: scale(1.125);
      `}
    }

    span:first-of-type {
      font-size: 0.875rem;
      line-height: 1rem;
      font-weight: ${themeVal('type.base.extrabold')};
      text-transform: uppercase;
    }

    span:last-of-type {
      grid-row: 2;
      font-size: 1.25rem;
      line-height: 1.5rem;
      font-weight: ${themeVal('type.base.regular')};
      letter-spacing: -0.025em;
    }
  }
`;

const PageTitleSecLink = styled(Link)`
  align-self: end;
  font-size: 0.75rem;
  font-weight: ${themeVal('type.base.bold')};
  line-height: 1rem;
  text-transform: uppercase;
  background: ${themeVal('color.surface')};
  padding: ${glsp(0, 0.25)};
  border-radius: ${themeVal('shape.rounded')};
  margin: ${glsp(0.125, 0.5)};

  &&,
  &&:visited {
    color: ${themeVal('color.primary')};
  }

  ${media.largeUp`
    margin: ${glsp(0, 0.5)};
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 0 ${glsp(0.5)};
  `}
`;

const GlobalNav = styled.nav<{ revealed: boolean }>`
  position: fixed;
  inset: 0 0 0 auto;
  z-index: 900;
  display: flex;
  flex-flow: column nowrap;
  width: 20rem;
  margin-right: -20rem;
  transition: margin 0.24s ease 0s;

  ${({ revealed }) =>
    revealed &&
    css`
      & {
        margin-right: 0;
      }
    `}

  ${media.largeUp`
    position: static;
    flex: 1;
    margin: 0;
  }

    &:before {
      content: '';
    }
  `}

  /* Show page nav backdrop on small screens */

  &::after {
    content: '';
    position: absolute;
    inset: 0 0 0 auto;
    z-index: -1;
    background: transparent;
    width: 0;
    transition: background 0.64s ease 0s;

    ${({ revealed }) =>
      revealed &&
      css`
        ${media.mediumDown`
          background: ${themeVal('color.base-400a')};
          width: 200vw;
        `}
      `}
  }
`;

const GlobalNavInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${themeVal('color.primary')};

  ${media.mediumDown`
    box-shadow: ${themeVal('boxShadow.elevationD')};
  `}
`;

const GlobalNavHeader = styled.div`
  padding: ${variableGlsp(1)};
  box-shadow: inset 0 -1px 0 0 ${themeVal('color.surface-200a')};
  ${media.largeUp`
    display: none;
  `}
`;

const GlobalNavTitle = styled(Heading).attrs({
  as: 'span',
  size: 'small'
})`
  /* styled-component */
`;

export const GlobalNavActions = styled.div`
  align-self: start;
  ${media.largeUp`
    display: none;
  `}
`;

export const GlobalNavToggle = styled(Button)`
  z-index: 2000;
`;

const GlobalNavBody = styled.div`
  display: flex;
  flex: 1;

  .shadow-top {
    background: linear-gradient(
      to top,
      ${themeVal('color.primary-600')}00 0%,
      ${themeVal('color.primary-600')} 100%
    );
  }

  .shadow-bottom {
    background: linear-gradient(
      to bottom,
      ${themeVal('color.primary-600')}00 0%,
      ${themeVal('color.primary-600')} 100%
    );
  }
`;

const GlobalNavBodyInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${variableGlsp()};
  padding: ${variableGlsp(1, 0)};

  ${media.largeUp`
    flex-direction: row;
    justify-content: space-between;
    padding: 0;
  `}
`;

const NavBlock = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: ${glsp(0.25)};

  ${media.largeUp`
    flex-direction: row;
    align-items: center;
    gap: ${glsp(1.5)};
  `}
`;

const SROnly = styled.a`
  height: 1px;
  left: -10000px;
  overflow: hidden;
  position: absolute;
  top: auto;
  width: 1px;
  color: ${themeVal('color.link')};
  &:focus {
    top: 0;
    left: 0;
    background-color: ${themeVal('color.surface')};
    padding: ${glsp(0.25)};
    height: auto;
    width: auto;
  }
`;

const SectionsNavBlock = styled(NavBlock)`
  /* styled-component */
`;

const GlobalNavBlockTitle = styled(Overline).attrs({
  as: 'span'
})`
  ${visuallyHidden}
  display: block;
  padding: ${variableGlsp(1, 1, 0.25, 1)};
  color: currentColor;
  opacity: 0.64;

  ${media.largeUp`
    padding: 0;
  `}
`;

const GlobalMenu = styled.ul`
  ${listReset()}
  display: flex;
  flex-flow: column nowrap;
  gap: ${glsp(0.5)};

  ${media.largeUp`
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: ${glsp(1.5)};
  `}
`;

const GlobalMenuItem = styled.span`
  ${GlobalMenuLinkCSS}
  cursor: default;
  &:hover {
    opacity: 1;
  }
`;

const GlobalMenuLink = styled(NavLink)`
  ${GlobalMenuLinkCSS}
`;
const GlobalMenuButton = styled(Button)`
  ${GlobalMenuLinkCSS}
`;

const DropMenuNavItem = styled(DropMenuItem)`
  &.active {
    background-color: ${rgbaFixed(themeVal('color.link'), 0.08)};
  }
  ${media.largeDown`
    padding-left ${glsp(2)};
  `}
`;

const MODAL_TYPE = 'modal';
// const DROPDOWN_TYPE = 'dropdown';

enum LinkItemType {
  InternalLink = 'internalLink',
  ExternalLink = 'externalLink'
}

type AlignmentEnum  = 'left' | 'right' ;

export interface InternalNavLink {
  title: string;
  to: string;
  type: 'internalLink'
}
export interface ExternalNavLink {
  title: string;
  href: string;
  type: 'externalLink'
}
export type NavLinkItem = (ExternalNavLink | InternalNavLink);
export interface ModalNavLink {
  title: string;
  type: 'modal';
  src: string;
}

export interface DropdownNavLink { 
  title: string;
  type: 'dropdown';
  children: NavLinkItem[];
}

export type NavItem = (NavLinkItem | ModalNavLink | DropdownNavLink);

interface PageHeaderProps {
  mainNavItems: NavItem[];
  subNavItems: NavItem[];
}

function ChildItem({ child }: { child: NavLinkItem}) {
  const { title, type, ...rest } = child;
  if (type === LinkItemType.InternalLink) {
    return (
    <li> 
      <DropMenuNavItem as={NavLink} {...rest as InternalNavLink} data-dropdown='click.close'>
        {title}
      </DropMenuNavItem>
    </li>
    );
  } else {
    return (
      <li key={`${title}-dropdown-menu`}>
        <DropMenuNavItem as='a' target='blank' rel='noopener' {...rest as ExternalNavLink} data-dropdown='click.close'>
          {title}
        </DropMenuNavItem>
      </li>
    );
  }
}


function NavItemMenu({ item, alignment, onClick }: {item: NavItem, alignment?: AlignmentEnum, onClick?: () => void }) {
  const { isMediumDown } = useMediaQuery();
  if (item.type === LinkItemType.InternalLink) {
    const { title, ...rest } = item as InternalNavLink;
      return (
        <li key={`${title}-nav-item`}>
        <GlobalMenuLink {...rest} onClick={onClick}>
          {title}
        </GlobalMenuLink>
        </li>
        
      );
  } else if (item.type === LinkItemType.ExternalLink) {
    const { title, ...rest } = item as ExternalNavLink;
    return (
      <li key={`${title}-nav-item`}>
      <GlobalMenuLink 
        as='a'
        target='blank'
        rel='noopener'
        onClick={onClick}
        {...rest} 
      >
        {title}
      </GlobalMenuLink>
      </li>
      
    );
  } else if (item.type === MODAL_TYPE) {
    return (<li><GoogleForm title={item.title} src={item.src} /></li>);
  } else {// if (item.type === DROPDOWN_TYPE
    const { title } = item as DropdownNavLink;
    // Mobile view
    if (isMediumDown) {
      return (
        <>
        <li><GlobalMenuItem>{title} </GlobalMenuItem></li>
          {item.children.map((child) => {
            return <ChildItem key={`${title}-dropdown-menu`} child={child} />;
          })}
        </>
      );
    } else {
    return (<li>
      <DropdownScrollable
        alignment={alignment?? 'left'}
        triggerElement={(props) => (
          // @ts-expect-error UI lib error. achromic-text does exit
          <GlobalMenuButton {...props} variation='achromic-text' fitting='skinny'>
            {title}
          </GlobalMenuButton>
        )}
      >
        <DropMenu>
          {item.children.map((child) => {
            return <ChildItem key={`${title}-dropdown-menu`} child={child} />;
          })}
        </DropMenu>
      </DropdownScrollable>
            </li>);
    }
  }
}

function PageHeader(props: PageHeaderProps) {
  const { mainNavItems, subNavItems } = props;
  const { isMediumDown } = useMediaQuery();

  const [globalNavRevealed, setGlobalNavRevealed] = useState(false);

  const globalNavBodyRef = useRef<HTMLDivElement>(null);
  // Click listener for the whole global nav body so we can close it when clicking
  // the overlay on medium down media query.
  const onGlobalNavClick = useCallback((e) => {
    if (!globalNavBodyRef.current?.contains(e.target)) {
      setGlobalNavRevealed(false);
    }
  }, []);

  useEffect(() => {
    // Close global nav when media query changes.
    // NOTE: isMediumDown is returning document.body's width, not the whole window width
    // which conflicts with how mediaquery decides the width.
    // JSX element susing isMediumDown is also protected with css logic because of this.
    // ex. Look at GlobalNavActions
    if (!isMediumDown) setGlobalNavRevealed(false);
  }, [isMediumDown]);

  const closeNavOnClick = useCallback(() => {
    setGlobalNavRevealed(false);
  }, []);

  function skipNav(e) {
    // a tag won't appear for keyboard focus without href
    // so we are preventing the default behaviour of a link here
    e.preventDefault();
    // Then find a next focusable element in pagebody,focus it.
    const pageBody = document.getElementById(PAGE_BODY_ID);
    if (pageBody) {
        pageBody.focus();
    }
  }

  return (
    <>
    <SROnly href='#' onClick={skipNav}>Skip to main content</SROnly>
    <PageHeaderSelf id={HEADER_ID}>
      
      {globalNavRevealed && isMediumDown && <UnscrollableBody />}
      <ComponentOverride with='headerBrand'>
        <Brand>
          <Link to='/'>
            <NasaLogo />
            <span>Earthdata</span> <span>{appTitle}</span>
          </Link>
          <Tip content={`v${appVersion}`}>
            <PageTitleSecLink to='/development'>Beta</PageTitleSecLink>
          </Tip>
        </Brand>
      </ComponentOverride>
      {isMediumDown && (
        <GlobalNavActions>
          <GlobalNavToggle
            aria-label={
              globalNavRevealed
                ? 'Close Global Navigation'
                : 'Open Global Navigation'
            }
            // @ts-expect-error UI lib error. achromic-text does exit
            variation='achromic-text'
            fitting='skinny'
            onClick={() => setGlobalNavRevealed((v) => !v)}
            active={globalNavRevealed}
          >
            <CollecticonHamburgerMenu />
          </GlobalNavToggle>
        </GlobalNavActions>
      )}
      <GlobalNav
        aria-label='Global Navigation'
        role='navigation'
        revealed={globalNavRevealed}
        onClick={onGlobalNavClick}
      >
        <GlobalNavInner ref={globalNavBodyRef}>
          {isMediumDown && (
            <>
              <GlobalNavHeader>
                <GlobalNavTitle aria-hidden='true'>Browse</GlobalNavTitle>
              </GlobalNavHeader>
            </>
          )}
          <GlobalNavBody as={isMediumDown ? undefined : 'div'}>
            <GlobalNavBodyInner>
              <SectionsNavBlock>
                <GlobalNavBlockTitle>Global</GlobalNavBlockTitle>
                <GlobalMenu>
                  {mainNavItems.map((item) => {
                    return <NavItemMenu key={`${item.title}-nav-item`} item={item} alignment='left' onClick={closeNavOnClick} />;
                  })}
                </GlobalMenu>
              </SectionsNavBlock>
              <SectionsNavBlock>
                <GlobalNavBlockTitle>Meta</GlobalNavBlockTitle>
                <GlobalMenu>
                  {subNavItems.map((item) => {
                    return <NavItemMenu key={`${item.title}-nav-item`} item={item} alignment='right' onClick={closeNavOnClick} />;
                  })}
                </GlobalMenu>
              </SectionsNavBlock>
            </GlobalNavBodyInner>
          </GlobalNavBody>
        </GlobalNavInner>
      </GlobalNav>
    </PageHeaderSelf>
    </>
  );
}

export default PageHeader;
