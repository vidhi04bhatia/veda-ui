import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import { evaluate } from '@mdx-js/mdx';
import { Button, ButtonGroup } from '@devseed-ui/button';
import styled from 'styled-components';
import { MDXContent } from 'mdx/types';
import remarkGfm from 'remark-gfm';
import * as runtime from 'react/jsx-runtime';
import { useMDXComponents } from '@mdx-js/react';
import MDXRenderer from './mdx-renderer';
import { MDXBlockWithError } from './block-with-error';
import { DataStoriesAtom } from '.';
import { useParams } from 'react-router';

interface useMDXReturnProps {
  source: string;
  result: MDXContent | null;
  error: any;
}

const useMDX = (source: string) => {
  const remarkPlugins = [remarkGfm];
  const [state, setState] = useState<useMDXReturnProps>({
    source,
    result: null,
    error: null
  });

  async function renderMDX() {
    let result: MDXContent | null = null;
    try {
      const wrappedSource = `<Block>${source}</Block>`;
      result = (
        await evaluate(wrappedSource, {
          ...runtime,
          useMDXComponents,
          useDynamicImport: true,
          remarkPlugins
        } as any)
      ).default;
      setState((oldState) => {
        return { ...oldState, source, result, error: null };
      });
    } catch (error) {
      setState((oldState) => {
        return { ...oldState, source, result: null, error };
      });
    }
  }

  useEffect(() => {
    renderMDX();
  }, [source]);

  return state;
};

const MDXRendererControls = styled.div<{ highlighted: boolean }>`
  background: ${(props) =>
    props.highlighted
      ? `repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    #eee 10px,
    #eee 20px
  )`
      : 'transparent'};
  position: relative;
`;

const MDXRendererActions = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
`;

export default function EditorBlock({
  mdx,
  id,
  onHighlight,
  highlighted
}: {
  mdx: string;
  id: string;
  onHighlight: (id: string) => void;
  highlighted: boolean;
}) {
  const { storyId } = useParams();
  const { result, error } = useMDX(mdx);
  const errorHumanReadable = useMemo(() => {
    if (!error) return null;
    const { line, message } = JSON.parse(JSON.stringify(error));
    return { message: `At line ${line - 1}: ${message}` };
  }, [error]);

  const setDataStories = useSetAtom(DataStoriesAtom);
  const onEditClick = useCallback(() => {
    setDataStories((oldDataStories) => {
      const newDataStories = [...oldDataStories];
      const storyIndex = newDataStories.findIndex(
        (s) => s.frontmatter.id === storyId
      );
      newDataStories[storyIndex].currentBlockId = id;
      return newDataStories;
    });
  }, [id, setDataStories, storyId]);
  return error ? (
    <MDXBlockWithError error={errorHumanReadable} />
  ) : (
    <MDXRendererControls
      highlighted={highlighted}
      onMouseOver={() => onHighlight(id)}
    >
      <MDXRenderer result={result} />
      {highlighted && (
        <MDXRendererActions>
          <ButtonGroup>
            <Button onClick={onEditClick}>Edit</Button>
            <Button>Remove</Button>
            <Button>Move up</Button>
            <Button>Move down</Button>
            <Button>Add new...</Button>
          </ButtonGroup>
        </MDXRendererActions>
      )}
      <div id={`block${id}`} />
    </MDXRendererControls>
  );
}
