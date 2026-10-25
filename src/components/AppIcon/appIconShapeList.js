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
  [AppIconName.BOOKING_SUMMARY]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M7 3.5h7.5L19 8v12.5H7Z',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M14.5 3.5V8H19',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M10 12h6M10 15.5h4',
    },
  ],
  [AppIconName.CANCEL_RULE]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4 12a8 8 0 1 0 2.4-5.7',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4 4.5V9h4.5',
    },
  ],
  [AppIconName.BED]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4 18V10M20 18V10',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M3 14h18',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4 14V11.5A1.5 1.5 0 0 1 5.5 10h13A1.5 1.5 0 0 1 20 11.5V14',
    },
    {
      shapeKind: AppIconShapeKind.CIRCLE,
      centerX: 8,
      centerY: 12.2,
      radius: 1.1,
    },
  ],
  [AppIconName.ROOM_SIZE]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4 20 20 4',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M8 16.5 7 17.5M12 12.5 11 13.5M16 8.5 15 9.5',
    },
  ],
  [AppIconName.FLOOR]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M5 20V9.5L12 4l7 5.5V20Z',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M5 13.5h14M5 17h14M12 9.5V20',
    },
  ],
  [AppIconName.GUEST]: [
    {
      shapeKind: AppIconShapeKind.CIRCLE,
      centerX: 12,
      centerY: 8,
      radius: 3,
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M6 19.5c.6-3 3-5 6-5s5.4 2 6 5',
    },
  ],
  [AppIconName.BREAKFAST]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M7 8h8v5.5a3.5 3.5 0 0 1-3.5 3.5h-1A3.5 3.5 0 0 1 7 13.5Z',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M15 10h1.8a2.2 2.2 0 0 1 0 4.4H15',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M8 20.5h8',
    },
  ],
  [AppIconName.PARKING]: [
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M4 16.5 6 10h12l2 6.5',
    },
    {
      shapeKind: AppIconShapeKind.PATH,
      pathData: 'M3.5 16.5h17V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z',
    },
    {
      shapeKind: AppIconShapeKind.CIRCLE,
      centerX: 7.5,
      centerY: 17.2,
      radius: 1.1,
    },
    {
      shapeKind: AppIconShapeKind.CIRCLE,
      centerX: 16.5,
      centerY: 17.2,
      radius: 1.1,
    },
  ],
};
