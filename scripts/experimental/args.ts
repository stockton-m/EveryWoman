const INCLUDE_FLAGS = new Set(["-e", "--include-experimental-content"]);

export function readExperimentalContentFlag(args: string[]): {
  include: boolean;
  args: string[];
} {
  return {
    include: args.some((arg) => INCLUDE_FLAGS.has(arg)),
    args: args.filter((arg) => !INCLUDE_FLAGS.has(arg)),
  };
}
