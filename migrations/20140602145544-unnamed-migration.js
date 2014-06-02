module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished

    migration.removeColumn('Players', 'slug').then(function(){
        done();
    }).catch(function(err){
        throw err;
    });
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished

    migration.addColumn('Players', 'slug', {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }).then(function(){
        done();
    }).catch(function(err){
        throw err;
    });
  }
}
