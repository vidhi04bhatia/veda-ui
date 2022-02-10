import React from 'react';
import T from 'prop-types';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { reveal } from '@devseed-ui/animation';

import { glsp, themeVal, media } from '@devseed-ui/theme-provider';
import { variableGlsp } from '../../styles/variable-utils';
import {
  datasetExplorePath,
  datasetOverviewPath,
  datasetUsagePath
} from '../../utils/routes';

const PageLocalNavSelf = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: ${variableGlsp()};
  padding: ${variableGlsp(0.5, 1)};
  background: ${themeVal('color.base-50')};
  box-shadow: 0 1px 0 0 ${themeVal('color.base-100a')};
  animation: ${reveal} 0.32s ease 0s 1;
`;

const LocalTitle = styled.div`
  a,
  a:visited {
    color: inherit;
    text-decoration: none;
  }
`;

const LocalMenu = styled.ul`
  margin: 0 0 0 auto;
  list-style: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: ${glsp()};

  a,
  a:visited {
    color: inherit;
    text-decoration: none;
  }
`;

const LocalMenuLink = styled(Link)`
  appearance: none;
  position: relative;
  display: flex;
  gap: ${glsp(0.5)};
  align-items: center;
  border: 0;
  background: none;
  cursor: pointer;
  color: currentColor;
  font-weight: bold;
  text-decoration: none;
  text-align: left;
  transition: all 0.32s ease 0s;

  ${media.largeUp`
    padding: ${glsp(0.5, 0)};
  `}

  &:hover {
    opacity: 0.64;
  }

  > * {
    flex-shrink: 0;
  }

  /* Menu link line decoration */

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0.125rem;
    height: 0;
    background: currentColor;

    ${media.largeUp`
      width: 0;
      height: 0.125rem;
    `}
  }

  &.active::after {
    ${media.mediumDown`
      height: 100%;
    `}

    ${media.largeUp`
      width: 100%;
    `}
  }
`;

function PageLocalNav(props) {
  const { thematic, dataset, title } = props;

  return (
    <PageLocalNavSelf>
      <LocalTitle>
        <LocalMenuLink to={datasetOverviewPath(thematic, dataset)}>
          {title}
        </LocalMenuLink>
      </LocalTitle>
      <LocalMenu>
        <li>
          <LocalMenuLink to={datasetOverviewPath(thematic, dataset)}>
            Overview
          </LocalMenuLink>
        </li>
        <li>
          <LocalMenuLink to={datasetExplorePath(thematic, dataset)}>
            Exploration
          </LocalMenuLink>
        </li>
        <li>
          <LocalMenuLink to={datasetUsagePath(thematic, dataset)}>
            Usage
          </LocalMenuLink>
        </li>
      </LocalMenu>
    </PageLocalNavSelf>
  );
}

export default PageLocalNav;

PageLocalNav.propTypes = {
  title: T.string,
  thematic: T.object,
  dataset: T.object
};
