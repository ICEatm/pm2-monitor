export default interface IShutdown {
  gracefulShutdown(): Promise<void>;
}
