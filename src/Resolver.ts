export interface IUnresolved {
	resolved: false;
}

export interface IResolved {
	resolved: true;
}

export interface IResolver<
	T,
	U extends T & IUnresolved,
	R extends T & IResolved
> {
	resolve(unresolvedObject: U): R | Promise<R>;
	resolveAll(unresolvedObjects: U[]): R[] | Promise<R[]>;
}
