import type { Texture } from '@pixi/core';
import { settings, utils, extensions, ExtensionType } from '@pixi/core';

import type { LoadAsset, Loader, LoaderParser } from '@pixi/assets';
import { LoaderParserPriority } from '@pixi/assets';
import { BitmapFont } from './BitmapFont';
import type { BitmapFontData } from './BitmapFontData';
import { TextFormat, XMLStringFormat } from './formats';

const validExtensions = ['.xml', '.fnt'];

/** simple loader plugin for loading in bitmap fonts! */
export const loadBitmapFont = {
    extension: {
        type: ExtensionType.LoadParser,
        priority: LoaderParserPriority.Normal,
    },

    test(url: string): boolean
    {
        return validExtensions.includes(utils.path.extname(url));
    },

    async testParse(data: string): Promise<boolean>
    {
        return TextFormat.test(data) || XMLStringFormat.test(data);
    },

    async parse(asset: string, data: LoadAsset, loader: Loader): Promise<BitmapFont>
    {
        const fontData: BitmapFontData = TextFormat.test(asset)
            ? TextFormat.parse(asset)
            : XMLStringFormat.parse(asset);

        const { src } = data;
        const { page: pages } = fontData;
        const textureUrls = [];

        for (let i = 0; i < pages.length; ++i)
        {
            const pageFile = pages[i].file;
            const imagePath = utils.path.join(utils.path.dirname(src), pageFile);

            textureUrls.push(imagePath);
        }

        const loadedTextures = await loader.load(textureUrls) as Record<string, Texture>;
        const textures = textureUrls.map((url) => loadedTextures[url]);

        return BitmapFont.install(fontData, textures, true);
    },

    async load(url: string, _options: LoadAsset): Promise<string>
    {
        const response = await settings.ADAPTER.fetch(url);

        return response.text();
    },

    unload(bitmapFont: BitmapFont): void
    {
        bitmapFont.destroy();
    }
} as LoaderParser<BitmapFont | string>;

extensions.add(loadBitmapFont);
