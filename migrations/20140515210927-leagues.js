module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('Leagues', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        'public': {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            default: true
        }
    }).success(function(){
        done();
    }).fail(function(err){
        throw err;
    });

  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeTable('Leagues').success(function(){
        done();
    }).fail(function(err){
        throw err;
    });

  }
}
