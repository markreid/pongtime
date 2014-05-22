module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Leagues', 'membersAreMods', {
        type: DataTypes.BOOLEAN,
        //allowNull: true,
        default: false
    }).then(function(){
        done();
    });
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn('Leagues', 'membersAreMods').then(function(){
        done();
    });
  }
}
