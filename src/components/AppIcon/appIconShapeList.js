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
      pathData: 'M5 6.5h14a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H10l-3.2 3V17H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2z',
    },
  ],
};
