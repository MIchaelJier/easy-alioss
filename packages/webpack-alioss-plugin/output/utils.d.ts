export declare const regexp: RegExp;
export declare function isValidKey(key: string | number | symbol, object: object): key is keyof typeof object;
export declare const getDate: (date: string | number | Date) => Date;
export declare const formatDate: (unknownDate?: string | number | Date, format?: string) => string;
