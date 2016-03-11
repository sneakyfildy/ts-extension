module.exports = function(grunt) {
	var watchLessFiles, watchJsFiles, warningSupress, projectGlobals;

	watchLessFiles = ['less/**/*.less'];
	watchJsFiles = ['**/*.js', '**/**/*.js'];

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
			},
			content_page_prod: {
				options: {
					cleancss: true,
					compress: true,
					strictMath: true,
					strictUnits: true
				},
				files: {
					'extension/build/css/content.min.css': 'extension/src/css/less/content.less'
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
            },
            popup_dev:{
                options:{
                    optimize: 'none',
                    out: 'extension/build/js/popup.dev.js',
                    name: 'PopupMain'
                }
            },
            options_page_dev:{
                options:{
                    optimize: 'none',
                    out: 'extension/build/js/options.dev.js',
                    name: 'OptionsMain'
                }
            },
            content_dev: {
                options: {
                    optimize: 'none',
                    out: 'extension/build/js/content.dev.js',
                    name: 'ContentMain',
                    onModuleBundleComplete: function (data) {
                        var fs = require('fs'),
                            amdclean = require('amdclean'),
                            outputFile = data.path;

                        fs.writeFileSync(outputFile, amdclean.clean({
                            'filePath': outputFile
                        }));
                    }
                }
            }
        },
        /* disabled */
        'closure-compiler': {
			content_release: {
				js: [
					'extension/build/js/content.dev.js'
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