import 'package:flutter_bloc/flutter_bloc.dart';

/// Holds the selected tab index for the main shell.
/// Persists across theme rebuilds so changing theme does not redirect to home.
class TabIndexCubit extends Cubit<int> {
  TabIndexCubit() : super(0);

  void selectTab(int index) {
    if (index != state) emit(index);
  }
}
