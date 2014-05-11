module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },

        compass: {
            options: {
                sassDir: 'public/app/styles',
                cssDir: 'public/app/styles',
                //generatedImagesDir: '.tmp/images/generated',
                //imagesDir: '<%= yeoman.app %>/images',
                javascriptsDir: 'public/app/scripts',
                fontsDir: 'public/app/bower_components/sass-bootstrap/fonts',
                importPath: 'public/app/bower_components',
                httpImagesPath: '/static/images',
                httpGeneratedImagesPath: '/static/images/generated',
                httpFontsPath: '/static/styles/fonts',
                relativeAssets: false,
                assetCacheBuster: false,
                raw: 'Sass::Script::Number.precision = 10\n',
                //sourceMaps: true
            },
            server: {
                options: {
                    debugInfo: true
                }
            }
        },

        watch: {
            compass: {
                files: ['public/app/styles/*.scss'],
                tasks: ['compass']
            }
        }

    });

    // Load the plugin that provides the "uglify" task.
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);
    grunt.registerTask('comp', ['compass']);

};
