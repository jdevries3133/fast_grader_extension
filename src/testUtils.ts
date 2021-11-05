export function getMockTabQueryFunc(tabs: Array<any>) {
  return async (tabAttrs: any) => {
    const result: Array<any> = [];
    tabs.map((tab) => {
      Object.keys(tabAttrs).forEach((k) => {
        // @ts-ignore
        if (tab[k] === tabAttrs[k]) {
          result.push(tab);
        }
      });
    });
    return result;
  };
}
