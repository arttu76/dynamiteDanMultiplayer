kubectl config use-context do-ams3-solvalou-cluster
kubectl rollout restart deployment.apps/dyndan-deployment
kubectl rollout status deployment.apps/dyndan-deployment -w
kubectl get pods
