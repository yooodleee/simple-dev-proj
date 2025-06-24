pipeline {
  agent any

  environment {
    AWS_REGION       = 'us-east-1'
    ECR_REPO         = '122610481100.dkr.ecr.us-east-1.amazonaws.com/devops-vote-app'
    IMAGE_TAG        = "${env.BUILD_NUMBER}"
    ECS_CLUSTER      = 'devops-vote-app'
    ECS_SERVICE      = 'devops-vote-app-service'
    TASK_DEF_FAMILY  = 'devops-vote-app-task'
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/yooodleee/simple-dev-proj.git'
      }
    }

    stage('Prepare Tools') {
      steps {
        sh '''
          set -e
          if ! command -v jq &> /dev/null; then
            echo "📦 Installing jq..."
            sudo apt-get update && sudo apt-get install -y jq
          fi
        '''
      }
    }

    stage('Authenticate to AWS & ECR') {
      steps {
        sh '''
          set -e
          echo "🔐 Logging into ECR..."
          aws configure set default.region $AWS_REGION
          aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          set -e
          echo "🛠️ Building Docker image..."
          docker build -t $ECR_REPO:$IMAGE_TAG .
          docker tag $ECR_REPO:$IMAGE_TAG $ECR_REPO:latest
        '''
      }
    }

    stage('Push to ECR') {
      steps {
        sh '''
          set -e
          echo "📤 Pushing Docker image to ECR..."
          docker push $ECR_REPO:$IMAGE_TAG
          docker push $ECR_REPO:latest
        '''
      }
    }

    stage('Deploy to ECS') {
      steps {
        sh '''
          set -e
          echo "🚀 Updating ECS service..."
          
          TASK_DEF_JSON=$(aws ecs describe-task-definition --task-definition $TASK_DEF_FAMILY)

          NEW_TASK_DEF=$(echo $TASK_DEF_JSON | jq --arg IMAGE "$ECR_REPO:$IMAGE_TAG" '
            .taskDefinition |
            {
              family: .family,
              networkMode: .networkMode,
              containerDefinitions: (
                .containerDefinitions | map(
                  if .name == "app" then .image = $IMAGE else . end
                )
              ),
              requiresCompatibilities: .requiresCompatibilities,
              cpu: .cpu,
              memory: .memory,
              executionRoleArn: .executionRoleArn,
              taskRoleArn: .taskRoleArn
            }')

          echo "$NEW_TASK_DEF" > new-task-def.json

          REGISTERED_TASK=$(aws ecs register-task-definition --cli-input-json file://new-task-def.json)
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
      echo '✅ Deployment succeeded!'
      script {
        try {
          slackSend(
            channel: '#devops-alerts',
            color: 'good',
            message: "✅ Jenkins Job '${env.JOB_NAME} #${env.BUILD_NUMBER}' 성공\n🔗 ${env.BUILD_URL}"
          )
        } catch (e) {
          echo "⚠️ Slack 전송 실패: ${e.message}"
        }

        mail to: 'accia25@naver.com',
             subject: "✅ SUCCESS: Jenkins Job ${env.JOB_NAME} #${env.BUILD_NUMBER}",
             body: "배포 성공 🎉\n🔗 ${env.BUILD_URL}"
      }
    }

    failure {
      echo '❌ Deployment failed!'
      script {
        try {
          slackSend(
            channel: '#devops-alerts',
            color: 'danger',
            message: "❌ Jenkins Job '${env.JOB_NAME} #${env.BUILD_NUMBER}' 실패\n🔗 ${env.BUILD_URL}"
          )
        } catch (e) {
          echo "⚠️ Slack 전송 실패: ${e.message}"
        }

        mail to: 'accia25@naver.com',
             subject: "❌ FAILURE: Jenkins Job ${env.JOB_NAME} #${env.BUILD_NUMBER}",
             body: "배포 실패 😢\n🔗 ${env.BUILD_URL}"
      }
    }
  }
}
