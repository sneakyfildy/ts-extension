module.exports = function(grunt) {
	var watchLessFiles, watchJsFiles, warningSupress, projectGlobals;

	watchLessFiles = ['less/**/*.less'];
	watchJsFiles = ['**/*.js'];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		less: {
			dev: {
				options: {
					strictMath: true,
					strictUnits: true
				},
				files: {
					'extension/build/css/ext.dev.css': 'extension/src/css/less/main.less'
				}
			},
			prod: {
				options: {
					cleancss: true,
					compress: true,
					strictMath: true,
					strictUnits: true
				},
				files: {
					'extension/build/css/ext.min.css': 'extension/src/css/less/main.less'
				}
			}
		},
        requirejs: {
            options: {
                baseUrl: 'extension/src/js',
                removeCombined: true,
                optimize: 'none',
                preserveLicenseComments: false
            },
            back_release:{
                options:{
                    optimize: 'uglify2',
                    out: 'extension/build/js/ext.min.js',
                    generateSourceMaps: true,
                    name: 'BackgroundMain'
                }
            },
            back_dev:{
                options:{
                    optimize: 'none',
                    out: 'extension/build/js/ext.dev.js',
                    name: 'BackgroundMain'
                }
            }
        },
        'closure-compiler': {
			content_release: {
				js: [
					'extension/src/js/content/content.js'
				],
				jsOutputFile: 'extension/build/js/content.cc.min.js',
				closurePath: 'grunt/ClosureCompiler',
				noreport: true,
				options: {
					compilation_level: 'ADVANCED_OPTIMIZATIONS',
                    create_source_map: 'extension/build/js/content.cc.min.js.map',
                    source_map_location_mapping: 'extension/|/',
                    output_wrapper: "%output%\n//# sourceMappingURL=content.cc.min.js.map"
				}
			}
		},
		watch: {
			less: {
				files: watchLessFiles,
				tasks: ['less'],
				options: { cwd: { files: 'extension/src/css/' }, spawn: false } // allow grunt to work from outer directory
			},
			js:{
				files: watchJsFiles,
				tasks: ['requirejs'/*, 'closure-compiler'*/],
				options: { cwd: { files: 'extension/src/js/', spawn: 'grunt' }, spawn: true } // allow grunt to work from outer directory
			}
		}
	});


	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-closure-compiler');

	// allow grunt to work from outer directory, additional tweak in watch task
	grunt.file.setBase('../');

	// default task: watches JS/LESS files and compiles them on change
	grunt.registerTask('default', ['less', 'requirejs'/*, 'closure-compiler'*/, 'watch']);
};