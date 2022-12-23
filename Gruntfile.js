module.exports = function (grunt) {

  const serviceConfig = grunt.file.readJSON("package.json");

  grunt.loadNpmTasks("@cimpress-technology/grunt-commerce-deploy");

  // application build and deployment
  grunt.option("region", serviceConfig.deploy.region);
  grunt.option("memoryReservation", serviceConfig.deploy.memoryReservation);
  grunt.option("dnsZone", "fi");
  grunt.option("packageName", serviceConfig.name);
  grunt.option("pavedPathDeployArtifacts", "cloudwatch");
  grunt.option(
    "sumoCollectorARN",
    "arn:aws:lambda:eu-west-1:732882016815:function:sumo-vpc"
  );
  grunt.option(
    "dependentDockerRepository",
    "768245867837.dkr.ecr.eu-west-1.amazonaws.com"
  );
};