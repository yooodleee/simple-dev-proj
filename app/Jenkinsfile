pipeline {
  agent any

  environment {
    AWS_REGION     = 'us-east-1'
    ECR_REPO       = '122610481100.dkr.ecr.us-east-1.amazonaws.com/devops-vote-app'
    IMAGE_TAG      = "${env.BUILD_NUMBER}"
    ECS_CLUSTER    = 'devops-vote-app'
    ECS_SERVICE    = 'devops-vote-app-service'
    TASK_DEF_FAMILY = 'devops-vote-app-task'
  }

  stages {
    stage('Checkout') {
      steps {
        git 'https://github.com/yooodleee/simple-dev-proj.git'
      }
    }

    stage('Authenticate to AWS') {
      steps {
        sh '''
          aws configure set default.region $AWS_REGION
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REPO
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t $ECR_REPO:$IMAGE_TAG .
        '''
      }
    }

    stage('Push to ECR') {
      steps {
        sh '''
          docker push $ECR_REPO:$IMAGE_TAG
        '''
      }
    }

    stage('Update ECS Service') {
      steps {
        sh '''
          TASK_DEF_JSON=$(aws ecs describe-task-definition --task-definition $TASK_DEF_FAMILY)
          NEW_TASK_DEF=$(echo $TASK_DEF_JSON | jq --arg IMAGE "$ECR_REPO:$IMAGE_TAG" '.taskDefinition | .containerDefinitions[0].image = $IMAGE | { family: .family, containerDefinitions: .containerDefinitions }')
          REGISTERED_TASK=$(aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF")
          NEW_REVISION=$(echo $REGISTERED_TASK | jq -r '.taskDefinition.revision')

          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --task-definition $TASK_DEF_FAMILY:$NEW_REVISION \
            --force-new-deployment
        '''
      }
    }
  }

  post {
    success {
      echo '✅ Deployment successful!'
      slackSend(channel: '#devops-alerts', color: 'good', message: "✅ Jenkins Job '${env.JOB_NAME} #${env.BUILD_NUMBER}' SUCCESS: ${env.BUILD_URL}")
      mail to: 'accia25@naver.com',
           subject: "SUCCESS: Jenkins Job ${env.JOB_NAME} #${env.BUILD_NUMBER}",
           body: "✅ Build succeeded. Check Jenkins: ${env.BUILD_URL}"
    }

    failure {
      echo '❌ Deployment failed.'
      slackSend(channel: '#devops-alerts', color: 'danger', message: "❌ Jenkins Job '${env.JOB_NAME} #${env.BUILD_NUMBER}' FAILED: ${env.BUILD_URL}")
      mail to: 'accia25@naver.com',
           subject: "FAILURE: Jenkins Job ${env.JOB_NAME} #${env.BUILD_NUMBER}",
           body: "❌ Build failed. Check Jenkins: ${env.BUILD_URL}"
    }
  }
}
