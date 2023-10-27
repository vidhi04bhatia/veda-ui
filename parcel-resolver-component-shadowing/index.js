/* eslint-disable @typescript-eslint/no-var-requires */
const { Resolver } = require('@parcel/plugin');
const path = require('path');
const fs = require('fs');
const { loadVedaConfig } = require('./config');

const DefaultResolver = require('@parcel/resolver-default').default;
const CONFIG = Symbol.for('parcel-plugin-config');

const defaultResolver = DefaultResolver[CONFIG].resolve;

const removeExt = (filePath) => filePath.replace(/\.[a-z]+$/g, '');

module.exports = new Resolver({
  async resolve(opts) {
    const { specifier, dependency } = opts;

    // Only script files can be shadowed.
    if (
      !dependency.resolveFrom ||
      !['esm', 'commonjs'].includes(dependency.specifierType)
    ) {
      return null;
    }

    const defaultResolution = await defaultResolver(opts);
    const appDir = path.join(__dirname, '../app');
    const filePathFromApp = path.relative(appDir, defaultResolution.filePath);

    // Only files inside the app directory can be shadowed.
    if (filePathFromApp.startsWith('..')) return null;

    const { result, root } = loadVedaConfig();

    const shadowSearchFolder = path.join(
      root,
      result.shadowFolder || 'overrides'
    );

    // If invoked from outside the app it is already a mock.
    const isResolvingFromMock = !path
      .relative(shadowSearchFolder, dependency.resolveFrom)
      .startsWith('..');

    // It is the same file if it is being invoked from a a file with the same
    // path but in the mock folder.
    const invokerPath = removeExt(dependency.resolveFrom);
    const resolvePath = removeExt(defaultResolution.filePath);
    const basePath = removeExt(filePathFromApp);
    const isSameFile =
      invokerPath.endsWith(basePath) && resolvePath.endsWith(basePath);

    if (isResolvingFromMock && isSameFile) return null;

    // const d = {
    //   id: dependency.id,
    //   specifier: dependency.specifier,
    //   specifierType: dependency.specifierType,
    //   priority: dependency.priority,
    //   bundleBehavior: dependency.bundleBehavior,
    //   needsStableName: dependency.needsStableName,
    //   isOptional: dependency.isOptional,
    //   isEntry: dependency.isEntry,
    //   loc: dependency.loc,
    //   env: dependency.env,
    //   packageConditions: dependency.packageConditions,
    //   meta: dependency.meta,
    //   target: dependency.target,
    //   sourceAssetId: dependency.sourceAssetId,
    //   sourcePath: dependency.sourcePath,
    //   sourceAssetType: dependency.sourceAssetType,
    //   resolveFrom: dependency.resolveFrom,
    //   range: dependency.range,
    //   pipeline: dependency.pipeline,
    //   symbols: dependency.symbols
    // };
    // console.log('dependency', d);

    const pathDiff = path
      .relative(path.join(__dirname, '../app'), defaultResolution.filePath)
      .replace(/\.[a-z]+$/g, '');

    //   console.log(`
    //   Resolving ${specifier}
    //   from ${dependency.resolveFrom}
    //   Is Mock: ${isMock ? 'YES' : 'NO'}

    //   resolution Path: ${defaultResolution.filePath}
    //   Relative to app: ${filePathFromApp.startsWith('..') ? 'NO' : 'YES'}
    //   ${filePathFromApp}

    //   Search Path: ${pathDiff}
    // `);

    const extensions = ['js', 'jsx', 'ts', 'tsx'];
    for (const ext of extensions) {
      const expectedPath = path.join(shadowSearchFolder, `${pathDiff}.${ext}`);
      // console.log('expectedPath', expectedPath);

      if (fs.existsSync(expectedPath)) {
        // console.log('OVERRIDE: found ✅');
        return {
          filePath: expectedPath
        };
      }
    }
    // console.log('OVERRIDE: not found');
    // console.log('-----------------------------------');

    // Let the next resolver in the pipeline handle
    // this dependency.
    return null;
  }
});
