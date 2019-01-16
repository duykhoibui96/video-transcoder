@Library("kobiton-pipeline@master") _

pipeline {
  agent {
    label "master"
  }

  tools {
    // koa lib requires Node version later than 6.0
    nodejs 'Node 7.x'
  }

  parameters {
    booleanParam(name: "DEPLOY_TO_TEST", defaultValue: true, description: "Build and deploy the branch master to Test server")
    booleanParam(name: "DEPLOY_TO_TEST_OP", defaultValue: true, description: "Build and deploy the branch master to Test On-Premise")
    booleanParam(name: "DEPLOY_TO_STAGING_AS_TEST", defaultValue: false, description: "Build and deploy the branch master to Staging server")
    booleanParam(name: "DEPLOY_TO_STAGING", defaultValue: true, description: "Build and deploy the branch prod to Staging server")
    booleanParam(name: "DEPLOY_TO_AHC", defaultValue: false, description: "Build and deploy the branch ahc to AHC server")
    booleanParam(name: "DEPLOY_TO_PROD", defaultValue: false, description: "Build and deploy the branch prod to PRODUCTION server")
  }

  options {
    disableConcurrentBuilds()
  }

  environment {
    APP_NAME = "api"
    NPM_ACCESS_KEY = credentials("npm_access_token")

    // For deploy
    REMOTE_USER = "ubuntu"
    WEB_SERVER_CREDENTIAL_ID = "ssh_credential_to_dev_server"
    
    // For K8S deployment
    // Cluster information
    REGISTRY_REGION = "us-west-2"
    REGISTRY_ID = "580359070243"
    AWS_CLUSTER_ACCESS_CREDENTIAL_ID = "kobiton-dev-k8s-cluster-access"

    // Kobiton SSL certification
    SSL_SECURITY_KEY_CREDENTIAL_ID = "kobiton-ssl-private-key"
    SSL_KOBITON_CERTIFICATE_CREDENTIAL_ID = "kobiton-ssl-certificate"
    SSL_TRUSTCHAIN_CERTIFICATE_CREDENTIAL_ID = "kobiton-ssl-trustchain-certificate"

    // Helm GitHub repo information
    GITHUB_BOT_TOKEN_CREDENTIAL_ID = "test_kobiton_github_bot_token"
    GITHUB_HELM_REPO_NAME = "devops"
    GITHUB_HELM_REPO_BRANCH = "master"
    GITHUB_HELM_REPO_OWNER = "kobiton"
  }

  stages {
    stage("Install node modules") {
      steps {
        script {
          vars.setErrorMessage(consts.SLACK_MESSAGE_FAILURE_INSTALL_NODE_MODULE)
          install(env.NPM_ACCESS_KEY)
        }
      }
    }

    stage("Test") {
      steps {
        script {
          String errorMessage = test(null, true)

          if (errorMessage) {
            error(errorMessage)
          }
        }
      }
    }

    // For Test environment
    stage("Deploy to Test") {
      when {
        expression {
          // Allow to skip deploy the branch master to Test server in case manual
          return env.BRANCH_NAME == "master" && params.DEPLOY_TO_TEST
        }
      }

      environment {
        KOBITON_ENVIRONMENT = "test"
        REMOTE_HOST = "${env.TEST_SERVER_HOST}"
      }

      steps {
        script {
          deploy.deployApi()
        }
      }
    }

    // For Kobiton test environment on K8S
    stage("Deploy to Test On-Premise") {
      when {
        expression {
          // Allow to skip deploy the branch master to Test server in case manual
          return env.BRANCH_NAME == "master" && params.DEPLOY_TO_TEST_OP
        }
      }

      environment {
        // Api build information
        KOBITON_ENVIRONMENT = "test-op"
        ENV_VAR_FILE_CREDENTIAL_ID = "kobiton-test-op-env-vars"

        // Cluster information
        KUBE_CONFIG_ID = "kobiton-test-k8s-kube-config"
      }

      steps {
        script {
          deploy.deployApi(true)
        }
      }
    }

    // Deploy a PR to Test to preview the docs site.
    stage("Deploy PR preview") {
      when {
        expression {
          return env.BRANCH_NAME.startsWith("PR-")
        }
      }

      environment {
        KOBITON_ENVIRONMENT = "test"
        APP_NAME = "api-${env.BRANCH_NAME}"
        REMOTE_HOST = "${env.TEST_SERVER_HOST}"
      }

      steps {
        script {
          // Don't ignore notifying build status to slack by setting "ignoreAppendingSlack" variable to false by default
          deploy.deployDocs("docs", false)
          utils.commentPR("A preview website for docs has been deployed on Test: https://${env.APP_NAME}.kobiton.com/docs", false)
        }
      }
    }

    // For Staging-as-test environment
    stage("Deploy to Staging As Test") {
      when {
        expression {
          // Allow to deploy the branch master to Staging server in case manual
          return env.BRANCH_NAME == "master" && params.DEPLOY_TO_STAGING_AS_TEST
        }
      }

      environment {
        KOBITON_ENVIRONMENT = "staging-as-test"
        REMOTE_HOST = "${env.STAGING_SERVER_HOST}"
      }

      steps {
        script {
          deploy.deployApi()
        }
      }
    }

    // For Staging environment
    stage("Deploy To Staging") {
      when {
        expression {
          // Allow to skip deploy the branch prod to Staging server in case manual
          return env.BRANCH_NAME == "prod" && params.DEPLOY_TO_STAGING
        }
      }

      environment {
        KOBITON_ENVIRONMENT = "staging"
        REMOTE_HOST = "${env.STAGING_SERVER_HOST}"
      }

      steps {
        script {
          deploy.deployApi()
        }
      }
    }

    // For AHC environment
    stage("Deploy To AHC Environment") {
      when {
        expression {
          // AHC environment
          return env.BRANCH_NAME == "ahc" && params.DEPLOY_TO_AHC
        }
      }

      environment {
        KOBITON_ENVIRONMENT = "ahc"
        REMOTE_HOST = "${env.AHC_SERVER_HOST}"
        WEB_SERVER_CREDENTIAL_ID = "ssh_credential_to_ahc_server"
      }

      steps {
        script {
          deploy.deployApi()
        }
      }
    }

    // For Production environment
    stage("Deploy to PRODUCTION") {
      when {
        expression {
          // Allow to deploy the branch prod to PRODUCTION server in case manual
          return env.BRANCH_NAME == "prod" && params.DEPLOY_TO_PROD
        }
      }

      environment {
        KOBITON_ENVIRONMENT = "prod"
        REMOTE_HOST = "${env.PROD_SERVER_HOST}"
        WEB_SERVER_CREDENTIAL_ID = "ssh_credential_to_prod_server"
        KOBITON_SEGMENT_KEY = credentials("kobiton_segment_token")
      }

      steps {
        script {
          deploy.deployApi()
        }
      }
    }
  }

  post {
    failure {
      script {
        sendToSlack(consts.TYPE_DEPLOY, consts.STATUS_FAILURE)
        utils.commentPR(vars.getErrorMessage(), true)
      }
    }

    success {
      script {
        file.uploadBuild("${vars.appName}-build.tgz")
        sendToSlack(consts.TYPE_DEPLOY, consts.STATUS_SUCCESS)
      }
    }
  }
}
