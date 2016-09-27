Simple benchmarks for testing the speed of JavaScript matrix libraries adapted from Brandon Jones benchmarks
in his glmatrix library: https://glmatrix.googlecode.com/hg/

If you have a browser with WebGL you can run the benchmarks [here](http://seclab03.cs.rice.edu/webworker/webglmatrix/).

## ToDo:

- Instead of iFrame make all the test run in WebWorker
- Optimize teste based on WebGl
- Implement polyfill if required

This work is based on Brandon's work as of this commit:

    e5ad8f6975eef038de668914a44ed36e2c611966
    Date:	October 10, 2010 12:49:00 PM EDT
    Upped version to 0.9.5

Comparing these matrix libraries:

* [glMatrix](http://code.google.com/p/glmatrix), [zlib license](http://www.opensource.org/licenses/Zlib)
* [mjs](http://code.google.com/p/webgl-mjs), [MIT license](http://www.opensource.org/licenses/mit-license.php)
* CanvasMatrix
* [EWGL_math](http://code.google.com/p/ewgl-matrices), [New BSD license](http://www.opensource.org/licenses/bsd-license.php)
* [tdl](http://code.google.com/p/threedlibrary/), [New BSD license](http://www.opensource.org/licenses/bsd-license.php)
* [Closure](http://closure-library.googlecode.com/), [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)
* [Sylvester](http://sylvester.jcoglan.com/), [MIT license](http://www.opensource.org/licenses/mit-license.php)

Changes from Brandon's original benchmark code include:

* Only including the benchmark code from glmatrix.
* Updated to the latest mjs as of Dec 15: 16:8e5b0944ef1e and included it in several more tests.
* Added a graph display of the results using flotr, see: http://solutoire.com/flotr/
* Added tdl library (thanks to Gregg Tavares)
* each library runs in an iframe so the code won't affect the other libraries (thanks to Gregg Tavares)
* Added Sylvester library (thanks to [Felix E. Klee](mailto:felix.klee@inka.de))

Brandon's original code was released under the [New BSD license](http://www.opensource.org/licenses/bsd-license.php).
My additions to the benchmarking code are released under the same license.

## Running locally requires a web server.

With the recent changes by Gregg Tavares that run each library in an iFrame you will need to either:

* Run the benchmarks from a local web server
* Configure the browser to allow local file access

### Configuring Chrome to allow local file access

On Windows you can add a flag in the shortcut. 

On Mac OS X start Chrome from the command line like this:

    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --allow-file-access-from-files

### Using Python's SimpleHTTPServer

    cd /path/to/webgl-matrix-benchmarks
    python -m SimpleHTTPServer

Now open: <http://localhost:8000/matrix_benchmark.html>
