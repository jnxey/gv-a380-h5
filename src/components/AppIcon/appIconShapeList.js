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
  [AppIconName.MAP]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z',
    },
    {
      shapeKind: AppIconShapeKind.CIRCLE,
      centerX: 12,
      centerY: 10,
      radius: 3,
    },
  ],
  [AppIconName.PHONE]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    },
  ],
};
