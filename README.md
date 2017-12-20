## Intro
This is a simple application created in Electron for grabbing, parsing, and outputting a csv file from the [Kentucky Court of Appeals website](http://apps.courts.ky.gov/coa%5Fpublic/)

Simply enter any number of case numbers formatted correctly into the text box and it will display which it retrive and which failed and allow the set of successful cases to be exported into a csv file.

Only one case number is allowed a line

##### Case number format:
```
2015-CA-001671-MA
```
###### '-MA' is optional

## Development
#### Start electron in dev mode
```bash
npm start
```

#### Build JSX
After modifying the jsx, or css files, recompile them using
```bash
npm run build
```

#### Compile applciation for current OS
```bash
npm run dist
```

## Extended off Electron Quick Start
[Quick Start Guide](http://electron.atom.io/docs/tutorial/quick-start)