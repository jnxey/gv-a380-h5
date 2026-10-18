import { AppIconName } from '../../utils/constants.js';

export const AppIconShapeKind = {
  PATH: 'PATH',
  CIRCLE: 'CIRCLE',
  RECT: 'RECT',
};

export const appIconShapeListByName = {
  [AppIconName.REVIEW]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M12 4.2 19.6 8 12 11.8 4.4 8Z',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4.4 8v7.4L12 19.2V11.8',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M19.6 8v7.4L12 19.2',
    },
  ],
};
