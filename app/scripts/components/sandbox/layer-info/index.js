import React from 'react';
import { datasets } from 'veda';
import Block from '$components/common/blocks';

import { ContentBlockProse } from '$styles/content-block';

export default function SandboxMDXPage() {
  const data = datasets['no2'].data.layers[0];
  const layerInfoMdxContent = data.info?.description;
  return layerInfoMdxContent ? (
    <Block>
      <ContentBlockProse>
        <h2>{data.name} Layer Info</h2>
        <div dangerouslySetInnerHTML={{ __html: layerInfoMdxContent }} />
      </ContentBlockProse>
    </Block>
  ) : (
    <div> Cannot find layer info fron dataset no2</div>
  );
}
