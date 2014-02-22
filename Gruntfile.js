module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            install: {
                options: {
                    targetDir: './src/js/lib',
                    layout: 'byComponent',
                    install: true,
                    verbose: false,
                    cleanTargetDir: true,
                    cleanBowerDir: true
                }
            }
        },
        ngmin: {
            controllers: {
                src: ['src/js/controllers/*.js'],
                dest: 'src/js/controllers.js'
            },
            services: {
                src: ['src/js/services/*.js'],
                dest: 'src/js/services.js'
            },
            directives: {
                src: ['src/js/directives/*.js'],
                dest: 'src/js/directives.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            build: {
                files: {
                    'build/js/<%= pkg.name %>.min.js': ['<%= concat.build.dest %>']
                }
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            build: {
                src: ['src/js/*.js'],
                dest: 'build/js/<%= pkg.name %>.js'
            }
        },
        copy: {
            build: {
                files: [{
                        cwd: 'src/',
                        expand: true,
                        src: ['template/**', 'js/lib/**', 'js/my-modules/**', 'index.html', 'css/**'],
                        dest: 'build/'
                    }]
            },
            lib: {
                files: [{
                        cwd: 'src/',
                        expand: true,
                        src: ['js/lib/**'],
                        dest: 'build/'
                    }]
            },
            img: {
                files: [{
                        cwd: 'src/',
                        expand: true,
                        src: ['img/**'],
                        dest: 'build/'
                    }]
            }
        },
        watch: {
            options: {
                nospawn: true
            },
            scripts: {
                files: ['src/js/app.js', 'src/js/controllers/*.js', 'src/js/services/*.js', 'src/js/directives/*.js'],
                tasks: ['ngmin', 'concat', 'uglify'],
                options: {
                    debounceDelay: 100,
                    event: ['all']
                }
            },
            resource: {
                files: ['src/template/**', 'src/js/lib/**', 'src/js/my-modules/**', 'src/index.html', 'src/css/**'],
                tasks: ['copy:build'],
                options: {
                    debounceDelay: 100,
                    event: ['added', 'changed']
                }
            },
            img: {
                files: ['src/img/**'],
                tasks: ['copy:img'],
                options: {
                    debounceDelay: 100,
                    event: ['added', 'changed']
                }
            },
            del: {
                files: ['src/**'],
                tasks: ['clean:target'],
                options: {
                    debounceDelay: 100,
                    event: ['deleted']
                }
            }
        },
        clean: {
            build: {
                src: ['build/']
            },
            target: {
                src: []
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.event.on('watch', function (action, filepath, task) {
        switch (task) {
            case 'img':
                grunt.config(['copy', 'img', 'files', '0', 'src'], [filepath.replace(/^src\\/, '')]);
                break;
                
            case 'resource':
                grunt.config(['copy', 'build', 'files', '0', 'src'], [filepath.replace(/^src\\/, '')]);
                break;

            case 'del':
                grunt.config(['clean', 'target', 'src'], [filepath.replace(/^src/, 'build')]);
                break;
            default:
                break;
        }
    });

    grunt.registerTask('build', ['clean:build', 'bower:install', 'ngmin', 'concat', 'uglify', 'copy']);
};